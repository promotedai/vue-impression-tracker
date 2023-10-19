import Vue from "vue";

// Simple logic for now.  A piece of content must have been continuously viewed
// for the visibilityTimeThreshold.
const DEFAULT_VISIBILITY_RATIO_THRESHOLD = 0.5;
const DEFAULT_VISIBILITY_TIME_THRESHOLD = 1000;

export type ActionTypeString =
  | "UNKNOWN_ACTION_TYPE"
  | "CUSTOM_ACTION_TYPE"
  | "NAVIGATE"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "CHECKOUT"
  | "PURCHASE"
  | "SHARE"
  | "LIKE"
  | "UNLIKE"
  | "COMMENT"
  | "MAKE_OFFER"
  | "ASK_QUESTION"
  | "ANSWER_QUESTION"
  | "COMPLETE_SIGN_IN"
  | "COMPLETE_SIGN_UP";

export interface ActionTypeMap {
  UNKNOWN_ACTION_TYPE: 0;

  // Action that doesn't correspond to any of the below.
  CUSTOM_ACTION_TYPE: 1;

  // Navigating to details about content.
  NAVIGATE: 2;

  // Adding an item to shopping cart.
  ADD_TO_CART: 4;

  // Remove an item from shopping cart.
  REMOVE_FROM_CART: 10;

  // Going to checkout.
  CHECKOUT: 8;

  // Purchasing an item.
  PURCHASE: 3;

  // Sharing content.
  SHARE: 5;

  // Liking content.
  LIKE: 6;

  // Un-liking content.
  UNLIKE: 9;

  // Commenting on content.
  COMMENT: 7;

  // Making an offer on content.
  MAKE_OFFER: 11;

  // Asking a question about content.
  ASK_QUESTION: 12;

  // Answering a question about content.
  ANSWER_QUESTION: 13;

  // Complete sign-in.
  // No content_id needed.  If set, set it to the Content's ID (not User).
  COMPLETE_SIGN_IN: 14;

  // Complete sign-up.
  // No content_id needed.  If set, set it to the Content's ID (not User).
  COMPLETE_SIGN_UP: 15;
}

export interface Action {
  userInfo?: {
    anonUserId?: string;
    userId?: string;
    isInternalUser?: boolean;
  };
  insertionId?: string;
  contentId?: string;
  impressionId: string;
  actionType?: ActionTypeMap[keyof ActionTypeMap] | ActionTypeString;
  elementId?: string;
  navigateAction?: {
    targetUrl?: string;
  };
  properties?: {
    struct: any;
  };
}

export type ImpressionSourceTypeString = "UNKNOWN_IMPRESSION_SOURCE_TYPE" | "DELIVERY" | "CLIENT_BACKEND";

export interface ImpressionSourceTypeMap {
  UNKNOWN_IMPRESSION_SOURCE_TYPE: 0;
  DELIVERY: 1;
  CLIENT_BACKEND: 2;
}

export interface Impression {
  userInfo?: {
    anonUserId?: string;
    userId?: string;
    isInternalUser?: boolean;
  };
  insertionId?: string;
  contentId?: string;
  impressionId: string;
  sourceType?: ImpressionSourceTypeMap[keyof ImpressionSourceTypeMap] | ImpressionSourceTypeString;
  properties?: {
    struct: any;
  };
}

type HandleErrorFunction = (error: Error) => void;
type UUIDFunction = () => string;

// It was necessary to manually type props through the typedProp data
// function. Without this, Vue type anything in $props as any.
type PropNames =
  | "handleError"
  | "uuid"
  | "defaultSourceType"
  | "contentId"
  | "insertionId"
  | "impressionId"
  | "logImpression"
  | "logAction";

type PropValues<T> = T extends "handleError"
  ? HandleErrorFunction
  : T extends "uuid"
  ? UUIDFunction
  : T extends "defaultSourceType"
  ? ImpressionSourceTypeMap[keyof ImpressionSourceTypeMap] | ImpressionSourceTypeString
  : T extends "contentId"
  ? string
  : T extends "insertionId"
  ? string
  : T extends "impressionId"
  ? string
  : T extends "logImpression"
  ? (impression: Impression) => void
  : T extends "logAction"
  ? (action: Action) => void
  : never;

export default Vue.extend({
  data: function (): {
    /* Whether the impression tracker is active */
    active: boolean;
    /* The IntersectionObserver instance */
    observer: IntersectionObserver | null;
    /* The visibility timer reference */
    timer: ReturnType<typeof setTimeout> | null;
    /* Whether we've logged an insertion for this piece of content */
    logged: boolean;
    typedProp: <T extends PropNames>(prop: T) => PropValues<T>;
  } {
    return {
      active: true,
      observer: null,
      timer: null,
      logged: false,
      typedProp: (prop) => this.$props[prop],
    };
  },

  props: {
    contentId: {
      type: String,
      default: undefined,
    },
    insertionId: {
      type: String,
      default: undefined,
    },
    impressionId: {
      type: String,
      default: undefined,
    },
    handleError: {
      type: Function,
      default: () => console.error,
    },
    defaultSourceType: {
      default: 1,
    },
    logAction: {
      type: Function,
      default: undefined,
    },
    logImpression: {
      type: Function,
      default: undefined,
    },
    uuid: {
      type: Function,
      required: true,
    },
  },

  watch: {
    contentId: function (newContentId: string, oldContentId: string) {
      if (newContentId != oldContentId) {
        this.active = false;
        this.handleError(new Error("Detected contentId change, not supported."));
      }
    },
  },

  mounted: function () {
    const options = {
      root: null,
      margin: 0,
      threshold: DEFAULT_VISIBILITY_RATIO_THRESHOLD,
    };

    if (!this.typedProp("contentId")) {
      this.typedProp("handleError")(new Error("contentId should be set"));
      return;
    }

    if (typeof window !== "undefined" && typeof (window as any).IntersectionObserver !== "undefined") {
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].intersectionRatio >= DEFAULT_VISIBILITY_RATIO_THRESHOLD && !this.logged) {
          this.timer = setTimeout(this.logImpressionFunctor, DEFAULT_VISIBILITY_TIME_THRESHOLD);
        } else if (entries[0].intersectionRatio < DEFAULT_VISIBILITY_RATIO_THRESHOLD && this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
      }, options);
      this.observer.observe(this.$el);
    }
  },
  destroyed: function () {
    this.unload();
  },
  methods: {
    logImpressionFunctor() {
      if (this.logged || !this.active) {
        return;
      }

      this.logged = true;

      const impression: Impression = {
        impressionId: this.impressionId || this.typedProp("uuid")(),
        sourceType: this.typedProp("defaultSourceType"),
      };

      if (this.typedProp("insertionId")) {
        impression.insertionId = this.typedProp("insertionId");
      }

      if (this.typedProp("contentId")) {
        impression.contentId = this.typedProp("contentId");
      }

      this.typedProp("logImpression") && this.typedProp("logImpression")(impression);
    },

    logActionFunctor({
      impressionId,
      elementId,
      targetUrl,
      actionType = 2,
    }: {
      impressionId?: string;
      actionType?: ActionTypeMap[keyof ActionTypeMap] | ActionTypeString;
      elementId?: string;
      targetUrl?: string;
    } = {}) {
      if (!this.active) {
        return;
      }

      const action: Action = {
        impressionId: impressionId || this.impressionId || this.typedProp("uuid")(),
        actionType,
      };

      if (this.typedProp("insertionId")) {
        action.insertionId = this.typedProp("insertionId");
      }

      if (this.typedProp("contentId")) {
        action.contentId = this.typedProp("contentId");
      }

      if (elementId) {
        action.elementId = elementId;
      }

      if (targetUrl) {
        action.navigateAction = {
          targetUrl,
        };
      }

      this.typedProp("logAction") && this.typedProp("logAction")(action);
    },

    unload() {
      this?.observer?.unobserve(this.$el);
      this.timer && clearTimeout(this.timer);
    },
  },
});
