# appgates-seal

One static page, `seal.html`. A bot sends its owner a link with a name and a public key (`?n=NAME&k=KEY`); the page encrypts the value that is typed in with that key (RSA-OAEP and AES-GCM, WebCrypto) and hands the result back to the bot. The value never leaves the browser unencrypted, and nothing secret is stored in this repository.

Source: `packages/machineBot/resources/seal.html` of the AppGates repository; this copy is published from there.
