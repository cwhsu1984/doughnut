/**
 * @jest-environment jsdom
 */
import NoteNewDialog from "@/components/notes/NoteNewDialog.vue";
import { flushPromises } from "@vue/test-utils";
import helper from "../helpers";
import makeMe from "../fixtures/makeMe";

helper.resetWithApiMock(beforeEach, afterEach);

describe("adding new note", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const note = makeMe.aNote.title("mythical").please();

  it("search for duplicate", async () => {
    helper.apiMock.expectingPost(`/api/notes/search`).andReturnOnce([note]);
    const wrapper = helper
      .component(NoteNewDialog)
      .withStorageProps({ parentId: 123 })
      .mount();
    await wrapper.find("input#note-title").setValue("myth");
    jest.runAllTimers();
    await flushPromises();
    expect(wrapper.text()).toContain("mythical");
  });

  describe("search wikidata entry", () => {
    let wrapper;

    beforeEach(() => {
      helper.apiMock.expectingPost(`/api/notes/search`).andReturnOnce([]);
      wrapper = helper
        .component(NoteNewDialog)
        .withStorageProps({ parentId: 123 })
        .mount();
    });

    const titleInput = () => {
      return wrapper.find("input#note-title");
    };

    const searchAndSelectFirstResult = async (key: string) => {
      await titleInput().setValue(key);
      await wrapper.find("button#search-wikidata").trigger("click");
      await flushPromises();
      const result = await wrapper.find('select[name="wikidataSearchResult"]');
      result.findAll("option").at(1)?.setValue();
    };

    const replaceTitle = async () => {
      await wrapper.find("[id='titleRadio-Replace']").setChecked();
    };
    const appendTitle = async () => {
      await wrapper.find("[id='titleRadio-Append']").setChecked();
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const doNothing = () => {};

    it.each`
      searchTitle | wikidataTitle | action          | expectedTitle
      ${"dog"}    | ${"dog"}      | ${doNothing}    | ${"dog"}
      ${"dog"}    | ${"Dog"}      | ${doNothing}    | ${"Dog"}
      ${"dog"}    | ${"Canine"}   | ${replaceTitle} | ${"Canine"}
      ${"dog"}    | ${"Canine"}   | ${appendTitle}  | ${"dog / Canine"}
    `(
      "searh $searchTitle get $wikidataTitle and choose to $action",
      async ({ searchTitle, wikidataTitle, action, expectedTitle }) => {
        const searchResult = makeMe.aWikidataSearchEntity
          .label(wikidataTitle)
          .please();
        helper.apiMock
          .expectingGet(`/api/wikidata/search/${searchTitle}`)
          .andReturnOnce([searchResult]);
        await searchAndSelectFirstResult(searchTitle);
        await action();
        expect(<HTMLInputElement>titleInput().element.value).toBe(
          expectedTitle
        );
      }
    );
  });
});
