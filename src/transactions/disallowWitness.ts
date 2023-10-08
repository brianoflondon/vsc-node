import 'dotenv/config'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { DID } from 'dids'
import KeyResolver from 'key-did-resolver'
import { HiveClient } from '../utils'
import { PrivateKey } from '@hiveio/dhive'
import { CoreService } from '../services'
import { init } from './core'
import { DissallowWitness } from '../../chainstate-lib/types/coreTransactions'


void (async () => {
    const nodeId = process.argv[2]
    
    const setup: {identity, config, ipfsClient, logger} = await init()
      
    // sample usage
    // node --experimental-specifier-resolution=node --loader ts-node/esm src/transactions/allowWitness.ts did:key:z6Mkem7BvG8P2Mk35QqZguxUmQSaMVCA11DNioLF6zg9NCuW
    if(!nodeId) {
        console.error('Usage: disallowWitness.ts <nodeId>')
        process.exit(0)
    }

    const keyPrivate = new Ed25519Provider(Buffer.from(process.env.MULTISIG_ANTI_HACK_KEY, 'base64'))
    const did = new DID({ provider: keyPrivate, resolver: KeyResolver.getResolver() })
    await did.authenticate()


    console.log(setup.config.get('network.id'))

    const hiveResult = await HiveClient.broadcast.json({
        required_auths: [],
        required_posting_auths: [process.env.HIVE_ACCOUNT],
        id: "vsc.disallow_witness",
        json: JSON.stringify({
            action: 'disallow_witness',
            net_id: setup.config.get('network.id'),
            proof: await did.createJWS({
                node_id: nodeId,
                ts: new Date(),
                net_id: setup.config.get('network.id'),
            } as DissallowWitness),
        }),
    }, PrivateKey.fromString(process.env.HIVE_ACCOUNT_POSTING))

    console.log(hiveResult)

    
    process.exit(0)
})()