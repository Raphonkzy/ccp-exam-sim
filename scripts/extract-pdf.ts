// One-off: extract text of the official exam guide into data-qa/exam-guide.txt
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { PDFParse } from 'pdf-parse'

const buf = readFileSync('docs/cloud-practitioner-02.pdf')
const parser = new PDFParse({ data: new Uint8Array(buf) })
const res = await parser.getText()
mkdirSync('data-qa', { recursive: true })
writeFileSync('data-qa/exam-guide.txt', res.text)
console.log('pages:', res.total ?? '?', 'chars:', res.text.length)
