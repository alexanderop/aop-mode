# Component composition

Use this reference when a component duplicates shared behavior across variants,
or its props choose substantially different layouts. The examples use Vue and
Reka UI. Follow the consuming project's existing component library and conventions.

## Recognize the structural decision

This hypothetical API makes the dialog own the edit form and its fields:

```vue
<ConfigurableDialog
  mode="edit-profile"
  :show-header="true"
  :show-footer="true"
  :show-cancel="true"
  v-model:name="profile.name"
  v-model:bio="profile.bio"
/>
```

The problem is the dialog's knowledge of the profile form. A `disabled` prop or
`size="small"` does not justify replacing an otherwise useful component API.
Sketch the existing variants before choosing which parts to extract.

## Let callers own two different trees

These two dialogs share interaction components. Their consumer owns the form and
business events. This SFC emits requests to its parent. The parent controls each
open model and closes it after successful work, so emitting a request does not
pretend an asynchronous operation has finished.

```vue
<script setup lang="ts">
import { reactive } from 'vue';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui';

const confirmOpen = defineModel<boolean>('confirmOpen', { required: true });
const editOpen = defineModel<boolean>('editOpen', { required: true });
const profile = reactive({ name: '', bio: '' });
const emit = defineEmits<{
  confirm: [];
  save: [profile: { name: string; bio: string }];
}>();
</script>

<template>
  <DialogRoot v-model:open="confirmOpen">
    <DialogTrigger>Sign out</DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content">
        <DialogTitle>Sign out of this session?</DialogTitle>
        <DialogDescription>You can sign in again later.</DialogDescription>
        <footer>
          <DialogClose>Stay signed in</DialogClose>
          <button type="button" @click="emit('confirm')">Sign out</button>
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <DialogRoot v-model:open="editOpen">
    <DialogTrigger>Edit profile</DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content">
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>Update your public profile.</DialogDescription>
        <form @submit.prevent="emit('save', { ...profile })">
          <label>Name <input v-model="profile.name" required /></label>
          <label>Bio <textarea v-model="profile.bio" /></label>
          <footer>
            <DialogClose type="button">Cancel</DialogClose>
            <button type="submit">Save changes</button>
          </footer>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 50%);
}
.dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(28rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  box-sizing: border-box;
  padding: 1.5rem;
  background: Canvas;
  color: CanvasText;
}
</style>
```

Profile fields never cross the dialog API. Shared styles can live in the project's
UI layer. Add styled wrappers when they remove repeated presentation, while
preserving access to the underlying parts and their supported props and events.

[Reka's Dialog documentation](https://reka-ui.com/docs/components/dialog) describes
its focus handling, title and description wiring, and controlled open state.
Retain accessible names even when a design hides its visible heading. Add pending
and error feedback at the consumer when connecting these examples to real work.

## Share state only when parts need it

For a custom compound component, a local provider can connect descendants without
passing state through every intermediate layout component. This disclosure example
only demonstrates state coordination. It is not a dialog implementation and must
not replace dialog focus handling, modality, keyboard behavior, or scroll handling.

```ts
// disclosureContext.ts
import { inject, provide, readonly, ref, type InjectionKey, type Ref } from 'vue';

type DisclosureContext = {
  open: Readonly<Ref<boolean>>;
  setOpen: (value: boolean) => void;
};

const disclosureKey: InjectionKey<DisclosureContext> = Symbol('disclosure');

export function provideDisclosure(initialOpen = false): DisclosureContext {
  const open = ref(initialOpen);
  const context: DisclosureContext = {
    open: readonly(open),
    setOpen(value) {
      open.value = value;
    },
  };
  provide(disclosureKey, context);
  return context;
}

export function useDisclosure(): DisclosureContext {
  const context = inject(disclosureKey, undefined);
  if (!context) throw new Error('Disclosure parts require a DisclosureRoot');
  return context;
}
```

Call `provideDisclosure()` in the root's setup. Descendant setup functions call
`useDisclosure()` and invoke `setOpen()` instead of mutating the exposed ref.
Each root creates its own state. Nested consumers resolve the nearest provider.
Vue context follows component ancestry, including through Teleport. CSS selectors
follow the rendered DOM, so an ancestor selector outside a portal cannot style
ported content merely because the components share a provider.

Use slots alone when the caller can already connect the relevant parts. Extract
pure state transitions separately if they need isolated tests. Vue setup APIs
still require their component context.
See [Vue's provide and inject guide](https://vuejs.org/guide/components/provide-inject.html).

## Add only the extension points a caller needs

- Structure belongs in children or slots. A form can sit directly inside content.
- Styling needs a defined override contract. For Tailwind wrappers, follow the
  project's class-merging helper and pass consumer classes after defaults.
  String concatenation alone does not guarantee conflicting utilities resolve
  in the consumer's favor.
- Expose relevant state through stable attributes such as `data-state`.
  A `data-slot` identifies an actual rendered part, not a DOM node for a
  renderless provider. Exit styles also need the element to remain mounted.
- Use element composition for an existing compatible element. Preserve its
  semantics and forward the behavior's props, events, and element reference.

For example, the trigger can use a native button without nesting two buttons:

```vue
<DialogTrigger as-child>
	<button type="button" class="settings-row">Edit profile</button>
</DialogTrigger>
```

A custom button must honor the same forwarding contract. Changing the element to
an arbitrary `div` does not make it keyboard accessible. See
[Reka's composition guide](https://reka-ui.com/docs/guides/composition).

## Put convenience wrappers above the shared components

A fixed confirmation layout can be useful. This wrapper emits the business action
and leaves completion to its caller through the required open model.

```vue
<!-- ConfirmDialog.vue -->
<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui';

defineProps<{ title: string; description: string; confirmLabel: string }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child><slot name="trigger" /></DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
        <footer>
          <DialogClose>Cancel</DialogClose>
          <button type="button" @click="emit('confirm')">{{ confirmLabel }}</button>
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

Use the shared dialog styles above in the project's UI stylesheet. The required
trigger slot accepts one compatible element. If a caller needs a checkbox or a
different form layout, compose the underlying parts instead of adding another
mode to this wrapper.

## Keep a single-shape component simple

```vue
<UserAvatar :src="user.avatarUrl" :alt="user.name" size="small" />
```

If this covers the real callers, retain it. A compound API earns its place when
callers need independent control of parts or layout, not because it has more files.
