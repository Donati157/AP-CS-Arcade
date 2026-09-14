package betlife.game;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import betlife.game.Choice.FollowUp;
import betlife.model.Asset;
import betlife.model.CareerState;
import betlife.model.EducationState;
import betlife.model.Job;
import betlife.model.LifeEvent;
import betlife.model.LifeEvent.Kind;
import betlife.model.LifeStage;
import betlife.model.Player;
import betlife.model.Relationship;
import betlife.model.ShopItem;

/**
 * Holds the state of one BetLife playthrough and every action the player can take.
 *
 * The user interface never edits game state directly; it calls methods on this class
 * and then re-reads the state to refresh what is on screen. Actions other than
 * {@link #ageUp()} happen inside the current year and use up one of the year's actions.
 * {@link #ageUp()} is the engine of the simulation: it advances school and work,
 * settles money, lets relationships drift, and picks the year's life event.
 */
public class BetLifeGame {

    public static final int ACTIONS_PER_YEAR = 6;
    public static final int READ_BOOK_SMARTS = 3;
    public static final int CHECKUP_COST = 50;
    public static final String[] MAJORS = {"Computer Science", "Business", "Biology", "Arts"};

    // Simplified finances: no tax tables, just a flat share of salary kept and a flat yearly
    // living cost for adults who are out of school (students are supported by their family).
    static final double NET_INCOME_SHARE = 0.80;
    private static final int LIVING_COST_ADULT = 9000;
    private static final int ASSET_UPKEEP_PERCENT = 5;
    private static final int MAX_RELATIONSHIPS = 8;
    private static final String[] FRIEND_NAMES = {
        "Liam Parker", "Ava Nguyen", "Mateo Rivera", "Zoe Bennett", "Ethan Brooks", "Maya Patel"};

    /** Outcome of trying to buy something or pay for a service. */
    public enum PurchaseResult { SUCCESS, ALREADY_OWNED, NOT_ENOUGH_MONEY, NO_ACTIONS_LEFT }

    private final Random random;
    private final LifeEventEngine eventEngine;
    private final AgeProcessor ageProcessor;
    private final Player player;
    private final EducationState education;
    private final CareerState career = new CareerState();
    private final ArrayList<LifeEvent> timeline = new ArrayList<>();
    private final ArrayList<Relationship> relationships = new ArrayList<>();
    private final ArrayList<Asset> assets = new ArrayList<>();
    private int actionsRemaining = ACTIONS_PER_YEAR;
    private int nextFriendName = 0;
    private Decision pendingDecision;

    public BetLifeGame() {
        this(new Random());
    }

    /** Tests pass a seeded Random so the same life plays out every time. */
    public BetLifeGame(Random random) {
        this.random = random;
        this.eventEngine = new LifeEventEngine(random);
        this.ageProcessor = new AgeProcessor(this);
        // Development character: every life starts as Alex until character creation exists.
        player = new Player("Alex Carter", "Student", 16, 80, 90, 70, 65, 1250);
        education = new EducationState(EducationState.Stage.HIGH_SCHOOL, 10, 70);
        addStartingEvents();
        addStartingRelationships();
    }

    /** Alex's childhood, so the journal reads like a real life from the start. */
    private void addStartingEvents() {
        timeline.add(new LifeEvent(0, "You were born in a small town on a rainy morning.", Kind.MILESTONE));
        timeline.add(new LifeEvent(3, "You said your first full sentence, and it was about cookies."));
        timeline.add(new LifeEvent(5, "You started elementary school.", Kind.MILESTONE));
        timeline.add(new LifeEvent(6, "You learned to ride a bike without training wheels."));
        timeline.add(new LifeEvent(8, "You made a new best friend at school.", Kind.POSITIVE));
        timeline.add(new LifeEvent(9, "Your family adopted a dog named Pepper."));
        timeline.add(new LifeEvent(11, "You discovered a love for drawing."));
        timeline.add(new LifeEvent(12, "You won second place at the science fair.", Kind.POSITIVE));
        timeline.add(new LifeEvent(13, "You started middle school and joined the band."));
        timeline.add(new LifeEvent(14, "You started high school.", Kind.MILESTONE));
        timeline.add(new LifeEvent(15, "You joined a school club."));
        timeline.add(new LifeEvent(16, "Your friend invited you to a party."));
    }

    private void addStartingRelationships() {
        relationships.add(new Relationship("Emma Carter", "Mother", 90));
        relationships.add(new Relationship("Daniel Carter", "Father", 85));
        relationships.add(new Relationship("Noah Williams", "Friend", 70));
        relationships.add(new Relationship("Sophia Lee", "Friend", 65));
    }

    // ---- State ---------------------------------------------------------------

    public Player getPlayer() {
        return player;
    }

    public EducationState getEducation() {
        return education;
    }

    public CareerState getCareer() {
        return career;
    }

    /** The full life history, oldest event first. */
    public List<LifeEvent> getTimeline() {
        return timeline;
    }

    public List<Relationship> getRelationships() {
        return relationships;
    }

    public List<Asset> getAssets() {
        return assets;
    }

    public int getActionsRemaining() {
        return actionsRemaining;
    }

    public boolean hasActionsLeft() {
        return actionsRemaining > 0;
    }

    /** A decision the player still has to make before the year is settled, or null. */
    public Decision getPendingDecision() {
        return pendingDecision;
    }

    /** Cash plus the value of everything owned. */
    public int getNetWorth() {
        int total = player.getMoney();
        for (Asset asset : assets) {
            total += asset.getValue();
        }
        return total;
    }

    public boolean ownsAsset(String assetName) {
        for (Asset asset : assets) {
            if (asset.getName().equals(assetName)) {
                return true;
            }
        }
        return false;
    }

    // ---- Aging: the engine of the simulation ---------------------------------

    /**
     * Moves life one year forward; the details live in {@link AgeProcessor}.
     * Afterwards {@link #getPendingDecision()} may hold a question the player must answer
     * (a graduation choice or an event with options) before the year is settled.
     */
    public void ageUp() {
        player.ageUp();
        actionsRemaining = ACTIONS_PER_YEAR;
        ageProcessor.processYear();
    }

    /**
     * Applies the choice the player picked for the pending decision and clears it.
     * Returns where the UI should go next.
     */
    public FollowUp resolveDecision(int choiceIndex) {
        Choice choice = pendingDecision.getChoices().get(choiceIndex);
        pendingDecision = null;
        ageProcessor.applyEffect(choice.getEffect());
        Kind kind = choice.getFollowUp() == FollowUp.NONE ? Kind.NORMAL : Kind.MILESTONE;
        addEvent(choice.getResultText(), kind);
        if (choice.getFollowUp() == FollowUp.NONE && player.getOccupation().equals("High School Graduate")) {
            player.setOccupation("Taking Time Off");
        }
        return choice.getFollowUp();
    }

    /** Living costs for the coming year; shown on screens and charged by the age processor. */
    public int yearlyExpenses() {
        int cost = 0;
        boolean adult = player.getLifeStage() != LifeStage.BABY && player.getLifeStage() != LifeStage.CHILD
                && player.getLifeStage() != LifeStage.TEEN;
        if (adult && !education.isEnrolled()) {
            cost += LIVING_COST_ADULT;
        }
        for (Asset asset : assets) {
            cost += asset.getValue() * ASSET_UPKEEP_PERCENT / 100;
        }
        return cost;
    }

    void setPendingDecision(Decision decision) {
        pendingDecision = decision;
    }

    Random getRandom() {
        return random;
    }

    LifeEventEngine getEventEngine() {
        return eventEngine;
    }

    /** Adds a friend from the name pool, if there is room for one more person. */
    void meetNewFriend() {
        if (relationships.size() >= MAX_RELATIONSHIPS || nextFriendName >= FRIEND_NAMES.length) {
            return;
        }
        relationships.add(new Relationship(FRIEND_NAMES[nextFriendName], "Friend", 55));
        nextFriendName++;
    }

    // ---- Education choices ---------------------------------------------------

    public void enrollInUniversity(String major) {
        education.enrollInUniversity(major);
        player.setOccupation("University Student");
        addEvent("You enrolled at " + EducationState.UNIVERSITY_NAME + " to study " + major + ".", Kind.MILESTONE);
    }

    // ---- Career --------------------------------------------------------------

    public List<Job> getAvailableJobs() {
        return JobBoard.allJobs();
    }

    public boolean isEligibleFor(Job job) {
        return job.meetsRequirements(player, education);
    }

    /** Takes the job if the requirements are met. Returns false otherwise. */
    public boolean applyForJob(Job job) {
        if (!isEligibleFor(job)) {
            return false;
        }
        career.startJob(job);
        player.setOccupation(job.getTitle());
        addEvent("You were hired as a " + job.getTitle() + " at " + job.getCompany() + ".", Kind.MILESTONE);
        return true;
    }

    public void quitJob() {
        String title = career.getJob().getTitle();
        career.quit();
        player.setOccupation("Unemployed");
        addEvent("You quit your job as a " + title + ".");
    }

    public LifeEvent workHarder() {
        if (!useAction()) {
            return null;
        }
        career.changePerformance(6);
        player.changeHappiness(-1);
        return addEvent("You put in long hours at work and it showed.");
    }

    public LifeEvent takeItEasyAtWork() {
        if (!useAction()) {
            return null;
        }
        career.changePerformance(-4);
        player.changeHappiness(3);
        return addEvent("You took it easy at work this year.");
    }

    // ---- School actions ------------------------------------------------------

    public LifeEvent studyHarder() {
        if (!useAction()) {
            return null;
        }
        education.changePerformance(5);
        player.changeSmarts(2);
        return addEvent("You spent extra time studying for your exams.");
    }

    public LifeEvent skipStudying() {
        if (!useAction()) {
            return null;
        }
        education.changePerformance(-5);
        player.changeHappiness(2);
        return addEvent("You decided to take it easy instead of studying.");
    }

    public LifeEvent visitSchoolLibrary() {
        if (!useAction()) {
            return null;
        }
        player.changeSmarts(2);
        education.changePerformance(2);
        return addEvent("You studied in the school library after class.");
    }

    public LifeEvent attendClass() {
        if (!useAction()) {
            return null;
        }
        education.changePerformance(4);
        player.changeSmarts(1);
        return addEvent("You attended every lecture this semester.");
    }

    public LifeEvent skipClass() {
        if (!useAction()) {
            return null;
        }
        education.changePerformance(-6);
        player.changeHappiness(3);
        return addEvent("You skipped a few classes to enjoy campus life.");
    }

    // ---- Activities ----------------------------------------------------------

    public LifeEvent readBook() {
        if (!useAction()) {
            return null;
        }
        player.changeSmarts(READ_BOOK_SMARTS);
        return addEvent("You spent some time reading at the library.");
    }

    public LifeEvent meditate() {
        if (!useAction()) {
            return null;
        }
        player.changeHappiness(4);
        player.changeHealth(1);
        return addEvent("You took some time to meditate.");
    }

    public LifeEvent goForWalk() {
        if (!useAction()) {
            return null;
        }
        player.changeHealth(3);
        player.changeHappiness(2);
        return addEvent("You went for a long walk around the neighborhood.");
    }

    public LifeEvent playGame() {
        if (!useAction()) {
            return null;
        }
        player.changeHappiness(4);
        return addEvent("You spent the afternoon playing games.");
    }

    public LifeEvent spendTimeOutside() {
        if (!useAction()) {
            return null;
        }
        player.changeHappiness(2);
        player.changeHealth(2);
        return addEvent("You spent some time outside in the fresh air.");
    }

    /** Doctor visit: costs money and one action, gives a little health. */
    public PurchaseResult visitDoctor() {
        if (!hasActionsLeft()) {
            return PurchaseResult.NO_ACTIONS_LEFT;
        }
        if (!player.canAfford(CHECKUP_COST)) {
            return PurchaseResult.NOT_ENOUGH_MONEY;
        }
        useAction();
        player.changeMoney(-CHECKUP_COST);
        player.changeHealth(3);
        addEvent("You went to the doctor for a general checkup.");
        return PurchaseResult.SUCCESS;
    }

    // ---- Relationships -------------------------------------------------------

    public LifeEvent spendTime(Relationship relationship) {
        if (!useAction()) {
            return null;
        }
        relationship.changeLevel(5);
        relationship.markInteracted();
        player.changeHappiness(2);
        return addEvent("You spent some quality time with " + relationship.getFirstName() + ".");
    }

    public LifeEvent compliment(Relationship relationship) {
        if (!useAction()) {
            return null;
        }
        relationship.changeLevel(3);
        relationship.markInteracted();
        player.changeHappiness(1);
        return addEvent("You gave " + relationship.getFirstName() + " a heartfelt compliment.");
    }

    public LifeEvent argue(Relationship relationship) {
        if (!useAction()) {
            return null;
        }
        relationship.changeLevel(-8);
        relationship.markInteracted();
        player.changeHappiness(-3);
        return addEvent("You had an argument with " + relationship.getFirstName() + ".");
    }

    // ---- Shopping ------------------------------------------------------------

    public List<ShopItem> getShopItems() {
        ArrayList<ShopItem> items = new ArrayList<>();
        items.add(new ShopItem("Used Bicycle", "Vehicle", 200, LifeStage.CHILD));
        items.add(new ShopItem("Used Car", "Vehicle", 3000, LifeStage.YOUNG_ADULT));
        return items;
    }

    /** Buys the item if it is not owned yet and the player can pay. Purchases do not use an action. */
    public PurchaseResult buy(ShopItem item) {
        if (ownsAsset(item.getName())) {
            return PurchaseResult.ALREADY_OWNED;
        }
        if (!player.canAfford(item.getCost())) {
            return PurchaseResult.NOT_ENOUGH_MONEY;
        }
        player.changeMoney(-item.getCost());
        assets.add(new Asset(item.getName(), item.getType(), item.getCost()));
        addEvent("You bought a " + item.getName().toLowerCase() + ".", Kind.POSITIVE);
        return PurchaseResult.SUCCESS;
    }

    // ---- Helpers -------------------------------------------------------------

    /** Spends one of this year's actions. Returns false, changing nothing, when none are left. */
    private boolean useAction() {
        if (actionsRemaining <= 0) {
            return false;
        }
        actionsRemaining--;
        return true;
    }

    LifeEvent addEvent(String description) {
        return addEvent(description, Kind.NORMAL);
    }

    /** Records something that happened at the player's current age. Package-private: only game code adds events. */
    LifeEvent addEvent(String description, Kind kind) {
        LifeEvent event = new LifeEvent(player.getAge(), description, kind);
        timeline.add(event);
        return event;
    }
}
