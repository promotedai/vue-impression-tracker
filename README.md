# vue-impression-tracker

This library is used to track impressions using a Vue mixin. It currently support Vue v2 applications.

## Mixin

```vue
<script setup lang="ts">
defineProps({
  logImpression: {
    type: Function,
    required: true,
  },
  contentId: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div>Your Content</div>
</template>

<script lang="ts">
import impressionTracker from "vue-impression-tracker";
export default {
  mixins: [impressionTracker],
};
</script>
```

### Local Development

Run the watcher with: `yarn build:watch`.

Symlink the built module if you haven't yet.

```
cd dist
yarn link
```

Run unit tests with `yarn test` or link the built module to a test app.

```
yarn link vue-impression-tracker
```

## Deploy

We use a GitHub action that runs semantic-release to determine how to update versions. Just do a normal code review and this should work. Depending on the message prefixes (e.g. `feat: `, `fix: `, `clean: `, `docs: `), it'll update the version appropriately.

When doing a breaking change, add `BREAKING CHANGE:` to the PR. The colon is important.
