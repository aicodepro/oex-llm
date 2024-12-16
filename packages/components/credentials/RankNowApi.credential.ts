import { INodeParams, INodeCredential } from '../src/Interface'

class RankNowApi implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = 'Rank Now Credential'
        this.name = 'rankNowApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Google Application Credential File Path',
                name: 'googleSearchConsoleCredentialFilePath',
                description:
                    'Path to your google application credential json file. You can also use the credential JSON object (either one)',
                placeholder: 'your-path/application_default_credentials.json',
                type: 'string',
                optional: true
            },
            {
                label: 'Google Credential JSON Object',
                name: 'googleSearchConsoleCredential',
                description: 'JSON object of your google application credential. You can also use the file path (either one)',
                placeholder: `{
                  "type": ...,
                  "project_id": ...,
                  "private_key_id": ...,
                  "private_key": ...,
                  "client_email": ...,
                  "client_id": ...,
                  "auth_uri": ...,
                  "token_uri": ...,
                  "auth_provider_x509_cert_url": ...,
                  "client_x509_cert_url": ...
                }`,
                type: 'string',
                rows: 4,
                optional: true
            },
            {
                label: 'Index Now Key',
                name: 'indexNowKey',
                description: 'Index Now key for indexing on other search engines.',
                type: 'string',
                optional: true
            }
        ]
    }
}

module.exports = { credClass: RankNowApi }
