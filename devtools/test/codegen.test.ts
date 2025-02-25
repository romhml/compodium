import { it, describe, expect } from 'vitest'
import { generateComponentCode, generatePropsTemplate, genPropValue, updateComponentCode } from '../app/utils/codegen'

describe('codegen', () => {
  describe('genPropValue', () => {
    it('escape quotes in strings', () => expect(genPropValue(`'"`)).toEqual('\'\\&apos;&quot;\''))
    it('works with dates', () => expect(genPropValue(new Date(0))).toEqual('new Date(\'1970-01-01\')'))
    it('works with objects', () => expect(genPropValue({ foo: 'bar' })).toEqual('{ foo: \'bar\' }'))
    it('works with arrays', () => expect(genPropValue([{ foo: 'bar' }, '123', 123, new Date(0)])).toEqual(`[ { foo: 'bar' },'123',123,new Date('1970-01-01') ]`))
  })

  describe('generatePropsTemplate', () => {
    it('works with simple props', () => expect(generatePropsTemplate({ foo: 'bar', baz: true, num: 123 })).toEqual(`foo='bar'\nbaz\n:num="123"`))
    it('works with objects', () => expect(generatePropsTemplate({ foo: { bar: 'baz' } })).toEqual(`:foo="{ bar: 'baz' }"`))
    it('works with arrays', () => expect(generatePropsTemplate({ foo: [{ bar: 'baz' }, 123, 'bar'] })).toEqual(`:foo="[ { bar: 'baz' },123,'bar' ]"`))
  })

  describe('generateComponentCode', () => {
    it('works with simple props', () => expect(
      generateComponentCode('Button', { foo: 'bar', baz: true, bax: 123 })
    ).toEqual(`<Button foo='bar'\nbaz\n:bax="123" />`))

    it('omits default props', () => expect(
      generateComponentCode('Button', { foo: 'bar', baz: true, bax: 123 }, { baz: true, bax: 123 })
    ).toEqual(`<Button foo='bar' />`))
  })

  describe('updateComponentCode', () => {
    it('works', () => {
      const code = `<BaseButton> </BaseButton>`
      expect(updateComponentCode('BaseButton', code, { label: 'foo' })).toMatch(`<BaseButton label='foo'> </BaseButton>`)
    })

    it('works with self closing tags', () => {
      const code = `<BaseButton />`
      expect(updateComponentCode('BaseButton', code, { label: 'foo' })).toMatch(`<BaseButton label='foo' />`)
    })

    it('replaces props', () => {
      const code = `<BaseButton label="Click me!" />`
      expect(updateComponentCode('BaseButton', code, { label: 'foo' })).toMatch(`<BaseButton label='foo' />`)
    })

    it('works with kebab case components', () => {
      const code = `<base-button label="Click me!" />`
      expect(updateComponentCode('BaseButton', code, { label: 'foo' })).toMatch(`<base-button label='foo' />`)
    })

    it('works with closing tag', () => {
      const code = `<BaseButton label="Click me!"> </BaseButton>`
      expect(updateComponentCode('BaseButton', code, { label: 'foo' })).toMatch(`<BaseButton label='foo'> </BaseButton>`)
    })

    it('works with bools', () => {
      const code = `<BaseButton label="Click me!" bool> </BaseButton>`
      expect(updateComponentCode('BaseButton', code, { bool: false })).toMatch(`<BaseButton  label="Click me!"> </BaseButton>`)
    })

    it('omits default props', () => {
      const code = `<BaseButton label="Click me!"> </BaseButton>`
      expect(updateComponentCode('BaseButton', code, { label: 'foo' }, { label: 'foo' })).toMatch(`<BaseButton > </BaseButton>`)
    })
  })
})
