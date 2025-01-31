/**
 * @jest-environment jsdom
 */
import RepeatPage from "@/pages/RepeatPage.vue";
import flushPromises from "flush-promises";
import helper from "../helpers";
import makeMe from "../fixtures/makeMe";
import RenderingHelper from "../helpers/RenderingHelper";

let renderer: RenderingHelper;
let mockRouterPush = jest.fn();

helper.resetWithApiMock(beforeEach, afterEach);

beforeEach(() => {
  mockRouterPush = jest.fn();
  renderer = helper
    .component(RepeatPage)
    .withMockRouterPush(mockRouterPush)
    .withStorageProps({});
});

describe("repeat page", () => {
  const mountPage = async (
    repetition: Generated.RepetitionForUser | Record<string, never>
  ) => {
    helper.apiMock
      .expectingGet("/api/reviews/repeat")
      .andReturnOnce(repetition);
    const wrapper = renderer.currentRoute({ name: "repeat" }).mount();
    await flushPromises();
    return wrapper;
  };

  it("redirect to review page if nothing to repeat", async () => {
    helper.apiMock
      .expectingGet("/api/reviews/repeat")
      .andRespondOnce({ status: 404 });
    renderer.currentRoute({ name: "repeat" }).mount();
    await flushPromises();
    expect(mockRouterPush).toHaveBeenCalledWith({ name: "reviews" });
  });

  describe('repeat page with "just review" quiz', () => {
    let repetition: Generated.RepetitionForUser;

    beforeEach(() => {
      jest.useFakeTimers();
      const reviewPoint = makeMe.aReviewPoint.please();
      repetition = makeMe.aRepetition
        .withReviewPointId(reviewPoint.id)
        .please();
      helper.apiMock
        .expectingGet(`/api/review-points/${reviewPoint.id}`)
        .andReturnOnce(reviewPoint);
    });

    it("should call the answer api", async () => {
      const wrapper = await mountPage(repetition);
      helper.apiMock.expectingPost(`/api/reviews/answer`);
      await jest.runAllTimers();
      await wrapper.find("button.btn-primary").trigger("click");
    });
  });
});
