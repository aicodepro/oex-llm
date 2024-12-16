import { parse } from 'node-html-parser'

interface Page {
    url: string
    content: string
}

export const extractContactInfo = (pages: Page[]) => {
    let aboutUs = ''
    let contactUs = {}

    pages.forEach((page) => {
        const root = parse(page.content)

        // Extract About Us
        if (page.url.includes('/about') || root.innerText.toLowerCase().includes('about us')) {
            aboutUs = root.innerText.slice(0, 500) // Get the first 500 characters
        }

        // Extract Contact Us
        if (page.url.includes('/contact') || root.innerText.toLowerCase().includes('contact')) {
            const email = root.querySelector('a[href^="mailto:"]')?.getAttribute('href')?.replace('mailto:', '') || ''
            const phone = root.querySelector('a[href^="tel:"]')?.getAttribute('href')?.replace('tel:', '') || ''
            contactUs = { email, phone }
        }
    })

    return { aboutUs, contactUs }
}
