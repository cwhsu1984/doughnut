<template>
  <ShowPicture
    v-if="quizQuestion?.pictureWithMask"
    v-bind="quizQuestion?.pictureWithMask"
    :opacity="1"
  />
  <NoteFrameOfLinks
    v-bind="{ links: quizQuestion?.hintLinks, storageAccessor }"
  >
    <div class="quiz-instruction">
      <pre
        style="white-space: pre-wrap"
        v-if="quizQuestion?.questionType !== 'PICTURE_TITLE'"
        v-html="quizQuestion?.description"
      />
      <h2 v-if="!!quizQuestion?.mainTopic" class="text-center">
        {{ quizQuestion?.mainTopic }}
      </h2>
    </div>
  </NoteFrameOfLinks>

  <div v-if="quizQuestion?.questionType === 'JUST_REVIEW'">
    <ReviewPointAsync
      v-bind="{
        reviewPointId: quizQuestion?.quizQuestion.reviewPoint,
        storageAccessor,
      }"
    />
    <SelfEvaluateButtons
      @self-evaluated-memory-state="submitAnswer({ spellingAnswer: $event })"
      :key="quizQuestion?.quizQuestion.reviewPoint"
    />
  </div>
  <div v-else-if="quizQuestion?.questionType === 'SPELLING'">
    <form @submit.prevent.once="submitAnswer({ spellingAnswer: answer })">
      <div class="aaa">
        <TextInput
          scope-name="review_point"
          field="answer"
          v-model="answer"
          placeholder="put your answer here"
          :autofocus="true"
        />
      </div>
      <input
        type="submit"
        value="OK"
        class="btn btn-primary btn-lg btn-block"
      />
    </form>
  </div>
  <div class="row" v-else>
    <div
      class="col-sm-6 mb-3 d-grid"
      v-for="option in quizQuestion?.options"
      :key="option.noteId"
    >
      <button
        class="btn btn-secondary btn-lg"
        @click.once="submitAnswer({ answerNoteId: option.noteId })"
      >
        <div v-if="!option.picture" v-html="option.display" />
        <div v-else>
          <ShowPicture v-bind="option.pictureWithMask" :opacity="1" />
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import ShowPicture from "../notes/ShowPicture.vue";
import NoteFrameOfLinks from "../links/NoteFrameOfLinks.vue";
import TextInput from "../form/TextInput.vue";
import ReviewPointAsync from "./ReviewPointAsync.vue";
import useLoadingApi from "../../managedApi/useLoadingApi";
import usePopups from "../commons/Popups/usePopup";
import SelfEvaluateButtons from "./SelfEvaluateButtons.vue";
import { StorageAccessor } from "../../store/createNoteStorage";

export default defineComponent({
  setup() {
    return { ...useLoadingApi(), ...usePopups() };
  },
  props: {
    quizQuestion: {
      type: Object as PropType<Generated.QuizQuestionViewedByUser | undefined>,
      required: true,
    },
    storageAccessor: {
      type: Object as PropType<StorageAccessor>,
      required: true,
    },
  },
  components: {
    ShowPicture,
    NoteFrameOfLinks,
    TextInput,
    ReviewPointAsync,
    SelfEvaluateButtons,
  },
  emits: ["answered", "reloadNeeded"],
  data() {
    return {
      answer: "" as string,
    };
  },
  methods: {
    async submitAnswer(answerData: Partial<Generated.Answer>) {
      try {
        const answerResult = await this.api.reviewMethods.processAnswer({
          question: this.quizQuestion?.quizQuestion,
          ...answerData,
        });
        this.$emit("answered", answerResult);
      } catch (_e) {
        await this.popups.alert(
          "This review point doesn't exist any more or is being skipped now. Moving on to the next review point..."
        );
        this.$emit("reloadNeeded");
      }
    },
  },
});
</script>
