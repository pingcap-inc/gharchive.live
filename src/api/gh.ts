import useSWR, {SWRResponse} from 'swr'

const dataUrl = process.env.API_BASE + '/gh'

export interface RepoInfo {
  id: number
  full_name: string
  forks: number
  open_issues: number
  subscribers_count: number
  watchers: number
  language: string
  owner: {
    avatar_url: string
    html_url: string
    login: string
  }
}

export const useRepo = (repoName): SWRResponse<RepoInfo> => {
  return useSWR<RepoInfo>(repoName ? [repoName] : undefined, {
    fetcher: async repoName => {
      const {data} = await fetch(`${dataUrl}/repo/${repoName}`).then(res => res.json())
      return data
    },
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })
}
