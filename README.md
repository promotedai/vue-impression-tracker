# vue-impression-tracker

This library is used to track impressions using a Vue mixin. It currently support Vue v2 applications.

## Mixin

This library defines a Vue Mixin which accepts props, generates an impression id, and calls your provided logImpression function when a piece of content is viewed. Include the Mixin in your component with the following code:

### Tracked Component

```vue
<script setup lang="ts">
defineProps({
  // Required props:
  // The function to log the impression.
  logImpression: Function,
  // ID for the piece of content we are tracking,.
  contentId: String,
  // A function to generate a UUID.
  uuid: Function,

  // Optional props:
  // Called when an error occurs. Defaults to console.error.
  handleError: Function,
  // Specifies the source type. Defaults to DELIVERY.
  defaultSourceType: [Number, String],
  // Specify an insertion id. Defaults to undefined.
  insertionId: String,
  // Specify an impression id. Defaults to generating one with the required uuid function.
  impressionId: String,
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

### Parent Component

Also reference the [Sending Engagements on Web](https://docs.promoted.ai/docs/how-to-your-web-events-with-promoted-metrics) docs.

```vue
<script setup lang="ts">
import { createEventLogger } from 'promoted-snowplow-logger';
import { v4 } from "uuid";

const handleError = process.env.NODE_ENV !== 'production' ? (err) => { throw err; } : console.error;

const eventLogger = createEventLogger({
  enabled: true,
  platformName: 'mymarket',
  handleError,
});

const logImpression = eventLogger.logImpression;
const logAction = eventLogger.logAction;

const uuid = v4;
</script>

<template>
  <YourComponent :logImpression="logImpression" :logAction="logAction" :uuid="uuid" :handleError="handleError">
</template>
```

### Click Handler Example

```vue
<script setup lang="ts">
<template>
  <div v-on:click="logActionFunctor">Your Content</div>
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
