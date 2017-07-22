You need nodejs to compile the extension (i'm using npm 4.2.0 and node 7.10.0)
To compile run commands in this directory in this order:
`npm install`
`npm run build-prod-full`

The unpacked extension will be built and placed in a folder called `dist` and also archived. The uncompiled source code will also automatically be added to a zip for submitting to firefox.
