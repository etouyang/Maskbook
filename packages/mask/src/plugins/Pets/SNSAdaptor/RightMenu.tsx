import { useState, useEffect, useRef } from 'react'
import { makeStyles } from '@masknet/theme'
import classNames from 'classnames'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { PluginPetMessages } from '../messages'
import { PluginGameMessages } from '../../Game/messages'

type Props = {
    isShow: boolean
    mousePosition: { x: number; y: number }
    dragPosition: { x: number; y: number }
    onClose: () => void
}

const useStyles = makeStyles()(() => ({
    menu: {
        position: 'fixed',
        minWidth: '180px',
        backgroundColor: '#fff',
        opacity: 0,
        zIndex: 9999,
        transition: 'opacity 50ms',
        animation: 'menu-show 0.5s both',
        borderRadius: '12px',
        pointerEvents: 'none',
        boxShadow: '0 0 12px rgba(0,0,0,.1)',
        '&>div': {
            position: 'relative',
            display: 'block',
            padding: '20px',
            fontSize: '14px',
            transition: 'backgroundColor 100ms',
            cursor: 'pointer',

            '&>span': {
                pointerEvents: 'none',
            },
            '&:hover': {
                backgroundColor: '#f1f1f1',
            },
            '&:first-child': {
                borderRadius: '12px 12px 0 0',
            },
            '&:last-child': {
                borderRadius: '0 0 12px 12px',
            },
        },
    },
    show: {
        opacity: '1 !important',
        pointerEvents: 'auto',
    },
    menuItem: {
        borderTop: '1px solid #f1f1f1',
    },
    icon: {
        position: 'absolute',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        height: '16px',
        width: 'auto',
    },
    itemBox: {
        padding: '8px !important',
        backgroundColor: 'transparent !important',
        boxShadow: 'none !important',
        '&>ul': {
            display: 'block',
            margin: 0,
            padding: '20px',
            fontSize: '12px',
            color: '#444',
            boxSizing: 'border-box',
            boxShadow: '0 0 8px rgba(0,0,0,.1)',
            fontWeight: 500,
            backgroundColor: '#fff',
            borderRadius: '12px',
            position: 'absolute',
            bottom: 0,
            left: '8px',
            '&>li': {
                listStyle: 'none',
                padding: '4px 0',
            },
        },
    },
    link: {
        color: '#ccc',
        transition: 'color 200ms',
        '&:hover': {
            color: '#444',
        },
    },
    normal: {
        fontWeight: 'normal',
        color: '#777',
    },
}))

const urls = [
    'https://www.shadertoy.com/embed/ltffzl?gui=true&t=10&paused=false&muted=false',
    'https://www.shadertoy.com/embed/tt3GRN?gui=true&t=10&paused=false&muted=false',
    'https://www.shadertoy.com/embed/Ndc3zl?gui=true&t=10&paused=false&muted=false',
]

function RightMenu(props: Props) {
    const { classes } = useStyles()
    const refMenuDom = useRef<HTMLDivElement>(null)

    const [isLeft, setIsLeft] = useState(false)
    const [isTop, setIsTop] = useState(false)

    const { openDialog } = useRemoteControlledDialog(PluginPetMessages.events.essayDialogUpdated, () => {})
    const { openDialog: openGameDialog } = useRemoteControlledDialog(
        PluginGameMessages.events.essayDialogUpdated,
        () => {},
    )

    function addEvents() {
        document.body.addEventListener('click', props.onClose, false)
        document.body.addEventListener('scroll', props.onClose, false)
    }

    function removeEvents() {
        document.body.removeEventListener('click', props.onClose, false)
        document.body.removeEventListener('scroll', props.onClose, false)
    }
    useEffect(() => {
        if (props.isShow) {
            console.log('props.dragPosition.x', props.mousePosition.x)
            setIsLeft(props.mousePosition.x > window.innerWidth / 2)
            setIsTop(props.mousePosition.y > window.innerHeight / 2)
            addEvents()
        } else {
            removeEvents()
        }

        return () => removeEvents()
    }, [props.isShow, props.dragPosition.x, props.dragPosition.y])

    useEffect(() => {
        props.onClose()
    }, [props.dragPosition.x, props.dragPosition.y])

    const [urlsIndex, setIndex] = useState(0)

    function onClickMenu(type: string) {
        switch (type) {
            case 'change':
                openDialog()
                break
            case 'ski':
                openGameDialog()
                break
            case 'aboutUs':
                window.open('https://twitter.com/NonFFriend')
                break
            case 'tiktok':
                const dom = document.querySelector('main a .css-1dbjc4n .css-1dbjc4n')
                if (dom) {
                    setIndex((prev) => {
                        const next = prev === urls.length - 1 ? 0 : prev + 1
                        return next
                    })
                    let iframe: HTMLIFrameElement = document.getElementById('mask_iframe') as HTMLIFrameElement
                    if (!iframe) {
                        iframe = document.createElement('iframe')
                        iframe.id = 'mask_iframe'
                    }

                    iframe.style.cssText = 'width: 100%;height:100%;display:block;background-color: #222'
                    iframe.src = urls[urlsIndex]
                    iframe.allowFullscreen = true

                    dom.appendChild(iframe)

                    // ;(dom as HTMLDivElement).style.setProperty(
                    //     'background-image',
                    //     `url(https://api.neweb.top/bing.php?time=${Date.now()})`,
                    // )
                }
        }
        props.onClose()
    }

    function stopPop(e: React.MouseEvent) {
        e.stopPropagation()
        e.nativeEvent.stopPropagation()
    }

    return (
        <div
            ref={refMenuDom}
            onMouseDown={stopPop}
            onMouseUp={stopPop}
            className={classNames(classes.menu, {
                [classes.show]: props.isShow,
            })}
            style={{
                left: props.mousePosition.x,
                top: props.mousePosition.y,
                transform: `translate(${isLeft ? '-100%' : 0}, ${isTop ? '-100%' : 0})`,
            }}>
            <div onClick={() => onClickMenu('change')}>
                <span>Change</span>
            </div>
            <div onClick={() => onClickMenu('ski')}>
                <span>Ski</span>
            </div>
            <div onClick={() => onClickMenu('aboutUs')}>
                <span>About us</span>
            </div>
            <div onClick={() => onClickMenu('tiktok')}>
                <span>Show next</span>
            </div>
        </div>
    )
}

export default RightMenu
