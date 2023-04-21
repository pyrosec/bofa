# bofa

Bank of America TypeScript library and CLI tool implementing the featureset of the BofA mobile client. No native dependencies, session multiplexing support, and device spoofing built in.

## Install

Install with yarn. Install globally to get a `bofa` CLI tool that can be used to pilot the software.

## Usage

### Login

```sh
bofa init my-account
bofa sign-in --username bofaghost --password spectralbanking111
# check the response to see if an OTP is required
bofa send-otp
# get OTP to phone number on file
bofa validate-otp --otp <otp from SMS>
bofa register-device
```

### Get balances

```sh
bofa dashboard
```

### Get transaction history

```sh
bofa tx-history
```

### Get Zelle history

```sh
bofa zelle-history
```

### Get list of recipients

```sh
bofa recipients
```

### Transfer funds (BofA)

```sh
bofa transfer --op-code AT_SMT --payee-id <account-identifier> --amount 500
# transfer $500 to other BofA account available in the recipients list
```

### Transfer funds (Zelle)

```sh
bofa transfer --op-code AT_SMT --display-name 'SOME CORP LLC' --payee-alias-token somecorpllc@gmail.com --amount 500
# transfer $500 to Zelle recipient
```


## Author

project-ghost
