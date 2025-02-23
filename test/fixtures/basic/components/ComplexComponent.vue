<script setup lang="ts">
defineProps<{
  str: string
  num: number
  bool: boolean
  date: Date
  maybeStr?: string
  multipleTypes: string | number
  enum: 'primary' | 'secondary' | 'tertiary'
  enumList: ('primary' | 'secondary' | 'tertiary')[]
  stringList: string[]
  numberList: string[]
  obj: { num?: number, foo: string }
  arrayObj: { num?: number, foo: string }[]
  nested: { verynested: { label: string }[], foo: boolean, bar: string }
}>()
</script>
