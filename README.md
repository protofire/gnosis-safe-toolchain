# Gnosis Safe Toolchain

This library is ment to be used for interacting with Gnosis Safe contract.

![CI](https://github.com/protofire/gnosis-safe-toolchain/workflows/CI/badge.svg)
[![Code Style: prettier](https://img.shields.io/badge/Code_Style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

---

## Features ✨

### Generic commands

- Deploy
- Get transaction data/hash
- Approve hash
- Execute transaction

### Admin commands
- Add owner with threshold
- Change threshold
- Get owners
- Get threshold
- Is Owner
- Remove Owner
- Swap Owner

## Install
```bash
  $ yarn add @protofire/gnosis-safe-toolchain
```

## Test

Create `.env` file from `.env.example` and set `RPC_URL` which is used for [forking HardHat network](https://hardhat.org/guides/mainnet-forking.html#forking-from-mainnet), make sure [Gnosis Safe contracts](https://github.com/gnosis/safe-contracts) are deployed on the network you are forking, then run

```bash
  $ yarn test
```

## Usage 💡

TO-DO
>
>**NOTE**
>
> Meanwhile you can look at the test to learn how to use this
>

## Documentation 📄
TO-DO

## Licence ⚖️

MIT
