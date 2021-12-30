import type { CSSProperties } from 'react'
import '@webcomponents/custom-elements'
import '@google/model-viewer/dist/model-viewer'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': any
        }
    }
}

interface ModelViewProps {
    styleContent?: CSSProperties | undefined
    source: string
}

const ModelView = (props: ModelViewProps) => {
    const { styleContent, source } = props
    return (
        <div style={styleContent}>
            <model-viewer
                style={{ width: '90%', height: '100%', top: '5%', margin: 'auto' }}
                src={source}
                shadow-intensity="1"
                camera-controls
                auto-rotate
                ar
            />
        </div>
    )
}

export default ModelView
