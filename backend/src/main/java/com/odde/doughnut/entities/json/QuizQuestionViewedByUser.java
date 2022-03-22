package com.odde.doughnut.entities.json;

import com.odde.doughnut.entities.Link;
import com.odde.doughnut.entities.Note;
import com.odde.doughnut.entities.QuizQuestion;
import com.odde.doughnut.entities.repositories.NoteRepository;
import com.odde.doughnut.models.NoteViewer;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public class QuizQuestionViewedByUser {

    public Integer id;

    public QuizQuestion.QuestionType questionType;

    public String description;

    public String mainTopic;

    public Map<Link.LinkType, LinkViewed> hintLinks;

    public List<Integer> viceReviewPointIdList;

    public List<Note> scope;

    public List<Option> options;

    public static Optional<QuizQuestionViewedByUser> from(QuizQuestion quizQuestion, NoteRepository noteRepository) {
        if(quizQuestion == null) return Optional.empty();
        QuizQuestionViewedByUser question = new QuizQuestionViewedByUser();
        question.id = quizQuestion.getId();
        question.questionType = quizQuestion.getQuestionType();
        question.description = quizQuestion.getDescription();
        question.mainTopic = quizQuestion.getMainTopic();
        question.hintLinks = quizQuestion.getHintLinks();
        question.viceReviewPointIdList = quizQuestion.getViceReviewPointIdList();
        question.scope = quizQuestion.getScope();
        question.options = quizQuestion.getOptions();
        return Optional.of(question);
    }

    public static class Option {
        @Getter
        private NoteSphere note;
        @Getter
        private boolean isPicture = false;

        private Option() {
        }

        public static Option createTitleOption(Note note) {
            Option option = new Option();
            option.note = new NoteViewer(null, note).toJsonObject();
            return option;
        }

        public static Option createPictureOption(Note note) {
            Option option = new Option();
            option.note = new NoteViewer(null, note).toJsonObject();
            option.isPicture = true;
            return option;
        }

        public String getDisplay() {
            return note.getNote().getTitle();
        }
    }

    public interface OptionCreator {
        Option optionFromNote(Note note);
    }

    public static class TitleOptionCreator implements OptionCreator {
        @Override
        public Option optionFromNote(Note note) {
            return Option.createTitleOption(note);
        }
    }

    public static class PictureOptionCreator implements OptionCreator {
        @Override
        public Option optionFromNote(Note note) {
            return Option.createPictureOption(note);
        }
    }
}
