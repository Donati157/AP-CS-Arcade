package betlife.game;

import java.util.ArrayList;
import java.util.List;

import betlife.model.Job;

/**
 * The small, fixed list of jobs available in BetLife. Original companies and titles.
 */
public final class JobBoard {

    private JobBoard() {
        // Static list only.
    }

    public static List<Job> allJobs() {
        ArrayList<Job> jobs = new ArrayList<>();
        jobs.add(new Job("Retail Associate", "Maple Street Market", 22000, 16, false, null, 0));
        jobs.add(new Job("Office Assistant", "Northwind Logistics", 28000, 18, true, null, 0));
        jobs.add(new Job("Teaching Assistant", "Riverside Elementary", 30000, 18, true, null, 0));
        jobs.add(new Job("Gallery Assistant", "Lantern Arts Center", 30000, 18, true, "Arts", 0));
        jobs.add(new Job("Lab Assistant", "Bluefield Labs", 34000, 18, true, "Biology", 85));
        jobs.add(new Job("Junior Analyst", "Summit Partners", 42000, 18, true, "Business", 88));
        jobs.add(new Job("Junior Developer", "Pixel Harbor Software", 48000, 18, true, "Computer Science", 90));
        return jobs;
    }
}
