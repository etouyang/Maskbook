import { startPluginWorker, Plugin } from '@masknet/plugin-infra/background-worker'
import { createPluginDatabase } from '../../database/plugin-db'
import { createPluginHost, createSharedContext } from '../../../shared/plugin-infra/host'
import { getPluginMinimalModeEnabled } from '../../services/settings/old-settings-accessor'
import { hmr } from '../../../utils-pure'

const { signal } = hmr(import.meta.webpackHot)
startPluginWorker(createPluginHost(signal, createWorkerContext, getPluginMinimalModeEnabled))

function createWorkerContext(pluginID: string, signal: AbortSignal): Plugin.Worker.WorkerContext {
    let storage: Plugin.Worker.DatabaseStorage<any> = undefined!

    return {
        ...createSharedContext(pluginID, signal),
        getDatabaseStorage() {
            return storage || (storage = createPluginDatabase(pluginID, signal))
        },
    }
}
