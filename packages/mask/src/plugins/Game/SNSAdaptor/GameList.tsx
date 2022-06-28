import { Button, List, Typography } from '@mui/material'
import { makeStyles, useStylesExtends } from '@masknet/theme'
import { useI18N } from '../../../utils'
import { useGameList } from '../hook'
import type { GameInfo } from '../types'

const useStyles = makeStyles()(() => ({
    walletBar: {},
    title: {
        fontSize: '20px',
        fontWeight: '500',
        padding: 0,
    },
    gameList: {
        padding: 0,
    },
    gameBar: {
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '20px',
    },
    logo: {
        flex: 'none',
        width: '90px',
        height: '90px',
        borderRadius: '8px',
        backgroundColor: '#f7f7f7',
    },
    info: {
        flex: 'auto',
        margin: '0 10px 0 20px',
    },
    infoTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
    },
    introduction: {
        fontSize: '14px',
        color: '#888',
        marginTop: '10px',
    },
    rank: {
        backgroundColor: '#FAE4D5',
        color: '#EB7A5F',
        padding: '2px 8px',
        marginTop: '10px',
        borderRadius: '100px',
        display: 'inline-block',
        fontSize: '12px',
    },
    playBtn: {
        backgroundColor: '#E8F0FD',
        color: '#1B68F5',
        flex: 'none',
        alignSelf: 'center',
        minWidth: '80px',
        marginLeft: '4px',
        '&:hover': {
            backgroundColor: '#f7f7f7',
        },
    },
}))

interface Props {
    onPlay: (game: GameInfo) => void
}

const GameList = (props: Props) => {
    const { t } = useI18N()
    const classes = useStylesExtends(useStyles(), {})
    const gameList = useGameList()

    return (
        <List className={classes.walletBar}>
            <Typography className={classes.title}>{t('plugin_game_list_title')}</Typography>
            <ul className={classes.gameList}>
                {gameList
                    ? gameList.map((game: any) => (
                          <li className={classes.gameBar} key={game.id}>
                              <img className={classes.logo} src={game.image} alt="" />
                              <div className={classes.info}>
                                  <Typography className={classes.infoTitle}>{game.name}</Typography>
                                  <Typography className={classes.introduction}>{game.description}</Typography>
                                  <Typography className={classes.rank}>
                                      {t('plugin_game_list_rank')} {game.rank}
                                  </Typography>
                              </div>
                              <Button className={classes.playBtn} onClick={() => props.onPlay(game)}>
                                  {t('plugin_game_list_play')}
                              </Button>
                          </li>
                      ))
                    : null}
            </ul>
        </List>
    )
}

export default GameList
