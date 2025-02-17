import { DataProvider } from '@masknet/public-api'
import { EMPTY_LIST } from '@masknet/shared-base'
import { TokenType } from '@masknet/web3-shared-base'
import { ChainId } from '@masknet/web3-shared-evm'
import urlcat from 'urlcat'
import { compact } from 'lodash-unified'
import { LooksRareLogo, OpenSeaLogo } from '../../resources'
import type { TrendingAPI } from '../../types'
import { NFTSCAN_API } from '../constants'
import type { EVM, Response } from '../types'
import { fetchFromNFTScan, getContractSymbol } from '../helpers/EVM'
import { LooksRareAPI } from '../../looksrare'
import { OpenSeaAPI } from '../../opensea'

enum NonFungibleMarketplace {
    OpenSea = 'OpenSea',
    LooksRare = 'LooksRare',
}

export class NFTScanTrendingAPI implements TrendingAPI.Provider<ChainId> {
    private looksrare = new LooksRareAPI()
    private opensea = new OpenSeaAPI()

    private async getNftPlatformInfo(address: string): Promise<EVM.NFTPlatformInfo> {
        const url = urlcat(NFTSCAN_API, '/nftscan/getNftPlatformInfo', {
            keyword: address,
        })
        const response = await fetchFromNFTScan<Response<EVM.NFTPlatformInfo>>(url)
        return response.data
    }

    private async searchNftPlatformName(keyword: string): Promise<EVM.SearchNFTPlatformNameResult[]> {
        const url = urlcat(NFTSCAN_API, '/nftscan/searchNftPlatformName', {
            keyword,
        })
        const response = await fetchFromNFTScan<Response<EVM.SearchNFTPlatformNameResult[]>>(url)
        return response.data ?? EMPTY_LIST
    }

    private async getContractVolumeAndFloorByRange(
        contract: string,
        range: string,
    ): Promise<EVM.VolumeAndFloorRecord[]> {
        const url = urlcat(NFTSCAN_API, '/nftscan/getContractVolumeAndFloorByRange', {
            contract,
            range,
        })
        const response = await fetchFromNFTScan<Response<EVM.VolumeAndFloorRecord[]>>(url)
        return response.data ?? EMPTY_LIST
    }

    async getCoins(keyword: string, chainId = ChainId.Mainnet): Promise<TrendingAPI.Coin[]> {
        if (!keyword) return EMPTY_LIST
        const nfts = await this.searchNftPlatformName(keyword)

        const coins = await Promise.all(
            nfts.map(async (nft): Promise<TrendingAPI.Coin> => {
                const symbol = await getContractSymbol(nft.address, chainId)
                return {
                    id: nft.address,
                    name: nft.platform,
                    symbol,
                    type: TokenType.NonFungible,
                    address: nft.address,
                    contract_address: nft.address,
                    image_url: nft.image,
                }
            }),
        )
        return coins.filter((x) => x.symbol)
    }

    async getCurrencies(): Promise<TrendingAPI.Currency[]> {
        throw new Error('Not implemented yet.')
    }

    async getPriceStats(
        chainId: ChainId,
        coinId: string,
        currency: TrendingAPI.Currency,
        days: number,
    ): Promise<TrendingAPI.Stat[]> {
        const range = `${Math.min(days, 90)}d`
        const records = await this.getContractVolumeAndFloorByRange(coinId, range)
        return records.map((x) => [x.time, x.floor])
    }

    async getCoinTrending(
        chainId: ChainId,
        /** address as id */ id: string,
        currency: TrendingAPI.Currency,
    ): Promise<TrendingAPI.Trending> {
        const platformInfo = await this.getNftPlatformInfo(id)
        if (!platformInfo) {
            throw new Error(`NFTSCAN: Can not find token by address ${id}`)
        }
        const [symbol, openseaStats, looksrareStats] = await Promise.all([
            getContractSymbol(id, chainId),
            this.opensea.getStats(platformInfo.address).catch(() => null),
            this.looksrare.getStats(platformInfo.address).catch(() => null),
        ])
        const tickers: TrendingAPI.Ticker[] = compact([
            openseaStats
                ? {
                      logo_url: OpenSeaLogo,
                      // TODO
                      trade_url: `https://opensea.io/assets/ethereum/${platformInfo.address}`,
                      market_name: NonFungibleMarketplace.OpenSea,
                      volume_24h: openseaStats.volume24h,
                      floor_price: openseaStats.floorPrice,
                      sales_24: openseaStats.count24h,
                  }
                : null,
            looksrareStats
                ? {
                      logo_url: LooksRareLogo,
                      trade_url: `https://looksrare.org/collections/${platformInfo.address}`,
                      market_name: NonFungibleMarketplace.LooksRare,
                      volume_24h: looksrareStats.volume24h,
                      floor_price: looksrareStats.floorPrice,
                      sales_24: looksrareStats.count24h,
                  }
                : null,
        ])
        return {
            lastUpdated: new Date().toJSON(),
            dataProvider: DataProvider.NFTSCAN,
            contracts: [{ chainId, address: platformInfo.address }],
            currency,
            coin: {
                id,
                name: platformInfo.name,
                symbol,
                address: platformInfo.address,
                contract_address: platformInfo.address,
                type: TokenType.NonFungible,
                description: platformInfo.description,
                image_url: platformInfo.image,
                home_urls: compact([platformInfo.website]),
                community_urls: [
                    {
                        type: 'twitter',
                        link: platformInfo.twitter && `https://twitter.com/${platformInfo.twitter}`,
                    },
                    {
                        type: 'facebook',
                        // TODO format of facebook url is unknown
                        link: null,
                    },
                    {
                        type: 'discord',
                        link: platformInfo.discord,
                    },
                    {
                        type: 'instagram',
                        link: platformInfo.instagram && `https://www.instagram.com/${platformInfo.instagram}`,
                    },
                    {
                        type: 'medium',
                        link: platformInfo.medium && `https://medium.com/@${platformInfo.medium}`,
                    },
                    {
                        type: 'reddit',
                        link: platformInfo.reddit,
                    },
                    {
                        type: 'telegram',
                        link: platformInfo.reddit,
                    },
                    {
                        type: 'youtube',
                        link: platformInfo.youtube,
                    },
                    {
                        type: 'github',
                        link: platformInfo.github,
                    },
                ].filter((x) => x.link) as TrendingAPI.CommunityUrls,
            },
            market: {
                total_supply: platformInfo.total,
                current_price: platformInfo.floorPrice,
                floor_price: platformInfo.floorPrice,
                highest_price: platformInfo.highestPrice,
                owners_count: platformInfo.ownersCount,
                royalty: platformInfo.royalty,
                total_24h: platformInfo.trendingTotal_24h,
                volume_24h: platformInfo.trendingVolume_24h,
                average_volume_24h: platformInfo.trendingVolumeAverage_24h,
                volume_all: platformInfo.trendingVolume_all,
            },
            tickers,
        }
    }
}
