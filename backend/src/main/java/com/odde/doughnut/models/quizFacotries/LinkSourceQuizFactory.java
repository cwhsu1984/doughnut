package com.odde.doughnut.models.quizFacotries;

import com.odde.doughnut.entities.*;

import java.util.List;

public class LinkSourceQuizFactory implements QuizQuestionFactory {
    protected final Link link;
    protected final Note answerNote;
    private final User user;
    private List<Note> cachedFillingOptions = null;

    public LinkSourceQuizFactory(ReviewPoint reviewPoint) {
        this.link = reviewPoint.getLink();
        this.answerNote = link.getSourceNote();
        this.user = reviewPoint.getUser();
    }

    @Override
    public List<Note> generateFillingOptions(QuizQuestionServant servant) {
        if(cachedFillingOptions == null) {
            List<Note> cousinOfSameLinkType = link.getCousinOfSameLinkType(user);
            cachedFillingOptions = servant.choose5FromCohort(answerNote, n -> !n.equals(answerNote) && !n.equals(link.getTargetNote()) && !cousinOfSameLinkType.contains(n));
        }
        return cachedFillingOptions;
    }

    @Override
    public String generateInstruction() {
        return "Which one <em>is immediately " + link.getLinkTypeLabel() + "</em>:";
    }

    @Override
    public Note generateAnswerNote(QuizQuestionServant servant) {
        return answerNote;
    }

    @Override
    public int minimumFillingOptionCount() {
        return 1;
    }

    @Override
    public List<Note> knownRightAnswers() {
        return List.of(answerNote);
    }

}