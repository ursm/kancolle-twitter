import dedent from 'dedent'
import diff from 'jest-diff'

function unindent(text) {
  return text.split("\n").map(s => s.trimStart()).filter(s => s.length > 0).join("\n")
}

expect.extend({
  toEqualWithUnindent(received, expected) {
    received = unindent(received)
    expected = unindent(expected)

    const pass = received === expected

    const message = () => {
      const hint = this.utils.matcherHint('toEqualWithUnindent', undefined, undefined, {
        isNot:   this.isNot,
        promise: this.promise
      })

      if (!pass) {
        const difference = diff(expected, received, {
          expand: this.expand
        })

        if (difference && difference.includes('- Expect')) {
          return dedent`
            ${hint}

            Difference:

            ${difference}
          `
        }
      }

      return dedent`
        ${hint}

        Expected: ${this.utils.printExpected(expected)}
        Received: ${this.utils.printReceived(received)}
      `
    }

    return {
      actual: received,
      pass,
      message
    }
  }
})
