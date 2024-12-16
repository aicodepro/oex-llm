import { Tool } from '@langchain/core/tools'
import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { crawlWebsite } from './crawlWebsite'
import { analyzeSEO } from './seoAnalysisService'
import { extractSocialMediaLinks } from './socialMediaService'
import { extractContactInfo } from './contactService'

export interface WebsiteAuditParams {
    tenantId?: string
    storeId?: string
    aicodeproToken?: string
}

export class WebisteAudit extends Tool {
    static lc_name() {
        return 'WebsiteAudit'
    }

    get lc_secrets(): { [key: string]: string } | undefined {
        return {
            tenantId: 'TENANT_ID',
            storeId: 'STORE_ID',
            aicodeproToken: 'AICODEPRO_TOKEN'
        }
    }

    name = 'website-audit'

    protected tenantId: string
    protected storeId: string
    protected aicodeproToken: string

    description =
        'Use Website Audit API to audit your website and check website errors. Input should be the valid url of the website. Output will the json object giving the response by the request.'

    constructor(
        fields: WebsiteAuditParams = {
            tenantId: getEnvironmentVariable('TENANT_ID'),
            storeId: getEnvironmentVariable('STORE_ID'),
            aicodeproToken: getEnvironmentVariable('AICODEPRO_TOKEN')
        }
    ) {
        super(...arguments)
        if ((!fields.tenantId || !fields.storeId) && !fields.aicodeproToken) {
            throw new Error(
                `Tenant Id and Store Id key not set. You can set it as "TENANT_ID" and "STORE_ID" in your environment variables.`
            )
        }
        this.tenantId = fields.tenantId as string
        this.storeId = fields.storeId as string
        this.aicodeproToken = fields.aicodeproToken as string
    }

    async main(websiteUrl: string) {
        console.log(`Starting audit for: ${websiteUrl}`)

        // Crawl Website
        const pages = await crawlWebsite(websiteUrl, {}, { '*': 50 }, ['/blacklist-path'], 1000)

        // Perform SEO Analysis
        const seoReport = analyzeSEO(pages)

        // Extract Social Media Links
        const socialMediaLinks = extractSocialMediaLinks(pages)

        // Extract About Us and Contact Us Information
        const { aboutUs, contactUs } = extractContactInfo(pages)

        // Combine all results into a single JSON report
        const auditReport = {
            website: { url: websiteUrl, crawlDate: new Date().toISOString() },
            auditReport: seoReport,
            socialMediaLinks,
            aboutUs,
            contactUs
        }

        return auditReport
        // console.log("Audit Report:", JSON.stringify(auditReport, null, 2));
        // const structuredData = JSON.stringify(auditReport, null, 2);
        // const filePath = `./report/report.json`;

        // fs.mkdirSync(`./report`, {
        //   recursive: true,
        // });

        // fs.writeFileSync(filePath, structuredData, "utf-8");
        // return auditReport;
    }
    async _call(input: string) {
        if ((!this.tenantId || !this.storeId) && !this.aicodeproToken) {
            throw new Error('Tenant Id and Store Id or Aicodepro Token are required.')
        }
        const websiteUrl = input as string
        // Initialize Google API client
        const result = []

        if (this.tenantId && this.storeId) {
            const response = await this.main(websiteUrl)
            result.push(response)
        } else if (this.aicodeproToken) {
            const response = await this.main(websiteUrl)
            result.push(response)
        }
        return JSON.stringify({
            result
        })
    }
}
