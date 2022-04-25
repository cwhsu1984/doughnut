package com.odde.doughnut.models.quizFacotries;

import com.odde.doughnut.entities.Link;
import com.odde.doughnut.entities.Note;
import com.odde.doughnut.entities.ReviewPoint;
import com.odde.doughnut.entities.User;
import com.odde.doughnut.models.UserModel;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class FromSamePartAsQuizFactory implements QuizQuestionFactory, QuestionOptionsFactory {

  private final CategoryHelper categoryHelper;
  private Link cachedAnswerLink = null;
  private List<Note> cachedFillingOptions = null;
  private final User user;
  private final Link link;
  private final QuizQuestionServant servant;

  public FromSamePartAsQuizFactory(ReviewPoint reviewPoint, QuizQuestionServant servant) {
    user = reviewPoint.getUser();
    link = reviewPoint.getLink();
    this.servant = servant;
    categoryHelper = new CategoryHelper(servant, user, link);
  }

  @Override
  public List<Note> generateFillingOptions() {
    if (cachedFillingOptions == null) {
      List<Link> remoteCousins = categoryHelper.getReverseLinksOfCousins();
      cachedFillingOptions =
          servant.chooseFillingOptionsRandomly(remoteCousins).stream()
              .map(Link::getSourceNote)
              .collect(Collectors.toList());
    }
    return cachedFillingOptions;
  }

  @Override
  public Note generateAnswer() {
    if (getAnswerLink() == null) return null;
    return getAnswerLink().getSourceNote();
  }

  @Override
  public List<ReviewPoint> getViceReviewPoints(UserModel userModel) {
    Link answerLink = this.getAnswerLink();
    if (answerLink == null) {
      return Collections.emptyList();
    }
    ReviewPoint answerLinkReviewPoint = userModel.getReviewPointFor(answerLink);
    List<ReviewPoint> result = new ArrayList<>();
    result.add(answerLinkReviewPoint);
    result.addAll(categoryHelper.getCategoryReviewPoints(userModel));
    return result;
  }

  @Override
  public List<Note> knownRightAnswers() {
    return link.getCousinsOfSameLinkType(user);
  }

  @Override
  public Link getCategoryLink() {
    return categoryHelper.getCategoryLink();
  }

  protected Link getAnswerLink() {
    if (cachedAnswerLink == null) {
      List<Link> backwardPeers =
          servant.getCousinLinksOfSameLinkTypeHavingReviewPoint(link, user).toList();
      cachedAnswerLink = servant.randomizer.chooseOneRandomly(backwardPeers).orElse(null);
    }
    return cachedAnswerLink;
  }
}
