import { hmr } from '../../../utils-pure'
import { BackgroundInstance, BackgroundPluginHost } from '@masknet/sandboxed-plugin-runtime/background'
import { Flags } from '../../../shared/flags'
import { MessageTarget, WebExtensionMessage } from '@dimensiondev/holoflows-kit'
import { Plugin, registerPlugin } from '@masknet/plugin-infra'
import { None, Result, Some } from 'ts-results'
import { createPluginDatabase } from '../../database/plugin-db'

const { signal } = hmr(import.meta.webpackHot)
let hot: Map<string, (hot: Promise<{ default: Plugin.Worker.Definition }>) => void> | undefined
if (process.env.NODE_ENV === 'development') {
    const sym = Symbol.for('sandboxed plugin bridge hot map')
    hot = (globalThis as any)[sym] ??= new Map()
}

if (Flags.sandboxedPluginRuntime) {
    const host = new BackgroundPluginHost(
        {
            async getPluginList() {
                const plugins = await fetch('/sandboxed-modules/plugins.json').then((x) => x.json())
                return Object.entries(plugins)
            },
            async fetchManifest(id, isLocal) {
                const prefix: string = isLocal ? 'local-plugin' : 'plugin'
                const manifestPath = `/sandboxed-modules/${prefix}-${id}/mask-manifest.json`
                const manifestURL = new URL(manifestPath, location.href)
                if (manifestURL.pathname !== manifestPath) throw new TypeError('Plugin ID is invalid.')
                return fetch(manifestPath).then((x) => x.json())
            },
            // TODO: support signal
            createRpcChannel(id) {
                return new WebExtensionMessage<{ f: any }>({ domain: `mask-plugin-${id}-rpc` }).events.f.bind(
                    MessageTarget.Broadcast,
                )
            },
            // TODO: support signal
            createRpcGeneratorChannel(id) {
                return new WebExtensionMessage<{ g: any }>({ domain: `mask-plugin-${id}-rpc` }).events.g.bind(
                    MessageTarget.Broadcast,
                )
            },
            createTaggedStorage: createPluginDatabase,
        },
        process.env.NODE_ENV === 'development',
        signal,
    )
    host.__builtInPluginInfraBridgeCallback__ = __builtInPluginInfraBridgeCallback__
    host.onPluginListUpdate()
}
function __builtInPluginInfraBridgeCallback__(this: BackgroundPluginHost, id: string) {
    let instance: BackgroundInstance | undefined

    const base: Plugin.Shared.Definition = {
        enableRequirement: {
            architecture: { web: true, app: true },
            networks: { type: 'opt-out', networks: {} },
            target: 'beta',
        },
        ID: id,
        // TODO: read i18n files
        // TODO: read the name from the manifest
        name: { fallback: '__generated__bridge__plugin__' + id },
        experimentalMark: true,
    }
    const def: Plugin.DeferredDefinition = {
        ...base,
        Worker: {
            hotModuleReload: (reload) => hot?.set(id, reload),
            async load() {
                return { default: worker }
            },
        },
    }
    const worker: Plugin.Worker.Definition = {
        ...base,
        init: async (signal, context) => {
            const [i] = await this.startPlugin_bridged(id, signal)
            instance = i
        },
        backup: {
            async onBackup() {
                if (!instance?.backupHandler) return None
                const data = await instance.backupHandler.onBackup()
                if (data === None) return None
                if (!(data instanceof Some)) throw new TypeError('Backup handler must return Some(data) or None')
                return data as Some<any>
            },
            onRestore(data) {
                return Result.wrapAsync(async () => {
                    await instance?.backupHandler?.onRestore(data)
                })
            },
        },
    }
    if (hot?.has(id)) hot.get(id)!(def.Worker!.load())
    else registerPlugin(def)
}
