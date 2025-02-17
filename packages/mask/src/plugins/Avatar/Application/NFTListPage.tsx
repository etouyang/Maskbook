import { Icons } from '@masknet/icons'
import { ElementAnchor, RetryHint } from '@masknet/shared'
import { LoadingBase, makeStyles } from '@masknet/theme'
import { NetworkPluginID } from '@masknet/web3-shared-base'
import { Box, List, ListItem, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useI18N } from '../locales'
import { NFTImage } from '../SNSAdaptor/NFTImage'
import type { AllChainsNonFungibleToken } from '../types'

const useStyles = makeStyles<{ networkPluginID: NetworkPluginID }>()((theme, props) => ({
    root: {
        paddingTop: props.networkPluginID === NetworkPluginID.PLUGIN_EVM ? 60 : 16,
    },

    button: {
        textAlign: 'center',
        paddingTop: theme.spacing(1),
        display: 'flex',
        justifyContent: 'space-around',
        flexDirection: 'row',
        color: '#1D9BF0',
    },
    list: {
        gridGap: '12px 17px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '8px 16px 50px',
    },

    nftItem: {
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        overflow: 'hidden',
        padding: 0,
        flexDirection: 'column',
        borderRadius: 8,
        userSelect: 'none',
        justifyContent: 'center',
        lineHeight: 0,
    },
    skeleton: {
        width: 100,
        height: 100,
        objectFit: 'cover',
        boxSizing: 'border-box',
    },
    skeletonBox: {
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    image: {
        width: 100,
        height: 100,
        objectFit: 'cover',
        boxSizing: 'border-box',
        '&:hover': {
            border: `1px solid ${theme.palette.primary.main}`,
        },
        borderRadius: 8,
    },
}))

interface NFTListPageProps {
    tokenInfo?: AllChainsNonFungibleToken
    tokens: AllChainsNonFungibleToken[]
    onChange?: (token: AllChainsNonFungibleToken) => void
    children?: React.ReactElement
    pluginId: NetworkPluginID
    nextPage(): void
    loadFinish: boolean
    loadError?: boolean
}

export function NFTListPage(props: NFTListPageProps) {
    const { onChange, tokenInfo, tokens, children, pluginId, nextPage, loadError, loadFinish } = props
    const { classes } = useStyles({ networkPluginID: pluginId })
    const [selectedToken, setSelectedToken] = useState<AllChainsNonFungibleToken | undefined>(tokenInfo)
    const t = useI18N()

    const _onChange = (token: AllChainsNonFungibleToken) => {
        if (!token) return
        setSelectedToken(token)
        onChange?.(token)
    }

    useEffect(() => setSelectedToken(tokenInfo), [tokenInfo])

    if (!loadError && !loadFinish && !tokens.length)
        return (
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                }}>
                <Icons.EmptySimple variant="light" size={36} />
                <Typography color={(theme) => theme.palette.maskColor.main} fontSize={14} mt="14px">
                    {t.loading()}
                </Typography>
            </Box>
        )
    if (children) return <>{children}</>
    return (
        <Box className={classes.root}>
            <List className={classes.list}>
                {children ??
                    tokens.map((token: AllChainsNonFungibleToken, i) => (
                        <ListItem key={i} className={classes.nftItem}>
                            <NFTImage
                                key={i}
                                pluginId={pluginId}
                                showBadge
                                token={token}
                                selectedToken={selectedToken}
                                onChange={(token) => _onChange(token)}
                            />
                        </ListItem>
                    ))}
            </List>
            {loadError && !loadFinish && tokens.length && (
                <Stack py={1} style={{ gridColumnStart: 1, gridColumnEnd: 6 }}>
                    <RetryHint hint={false} retry={nextPage} />
                </Stack>
            )}
            <ElementAnchor
                callback={() => {
                    if (nextPage) nextPage()
                }}>
                {!loadFinish && tokens.length !== 0 && <LoadingBase />}
            </ElementAnchor>
        </Box>
    )
}
