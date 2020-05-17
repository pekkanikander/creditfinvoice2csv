# creditfinvoice2csv

Convert OP Credit card Finvoice invoice XML to CSV

## Columns

        buyer: BuyerOrganisationName,
        seller: Parsed from ArticleIdentifier,
        city: Parsed from ArticleIdentifier,
        country: Parsed from ArticleIdentifier,
        type: Parsed from ArticleIdentifier,
        amount: RowAmount
        currency: RowAmount
        card: ArticleName,
        date: RowDeliveryDate,
        fileName: fileName
 
## Usage

1. Install NodeJS to run this application from command line

For Mac OS X:

1.1. Install homebrew: https://brew.sh

1.2. Use Homebrew to install NodeJS `brew install node`

1.3. Test that it worked: `node --version`

2. Use NodeJS Package Manager to install dependencies

```sh
npm install
```

3. Download your credit card invoice(s) as XML

At the https://op.fi web site, do the following.  Currently OP serves only in Finnish or Swedish.

3.1. Go to your e-invoice archive:  `Näytä lisää...` -> `E-laskuarkisto`

3.2. Click the e-invoice you want to download

3.3. Click `Katso laskun tiedot` to see the invoice information

3.4. Click `Laskun tallennus omalle koneelle` to open options for storing your computer.

3.5. Click `Tallenna lasku omalle koneelle` to download the invoice

4. Run the application with `node`

The app takes the input file names on command line and produces CSV to the standard output:

```sh
node index.js <xml-files> > output`
```
