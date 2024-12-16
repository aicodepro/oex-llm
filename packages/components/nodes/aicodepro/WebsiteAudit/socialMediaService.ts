import { parse } from 'node-html-parser'

interface Page {
    url: string
    content: string
}

export interface SocialMediaLinks {
    [key: string]: string
}

const SOCIAL_MEDIA_DOMAINS: { [key: string]: string } = {
    'facebook.com': 'Facebook',
    'twitter.com': 'Twitter',
    'linkedin.com': 'LinkedIn',
    'instagram.com': 'Instagram',
    'youtube.com': 'YouTube'
}

export const extractSocialMediaLinks = (pages: Page[]) => {
    const socialMediaLinks: SocialMediaLinks = {}

    pages.forEach((page) => {
        const root = parse(page.content)
        const links = root
            .querySelectorAll('a')
            .map((a) => a.getAttribute('href'))
            .filter(Boolean)

        links.forEach((link) => {
            for (const [domain, name] of Object.entries(SOCIAL_MEDIA_DOMAINS)) {
                if (link?.includes(domain)) {
                    socialMediaLinks[name] = link
                }
            }
        })
    })

    return socialMediaLinks
}
