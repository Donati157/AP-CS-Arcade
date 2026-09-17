// Flavour lines about the wider world, the way the recordings mix news into the journal.
// No effects, low weight, long cooldowns. Original fictional content.
import { ev } from './define.js';

const line = (id, text) => ev({ id, category: 'news', minAge: 6, weight: 0.5, cooldown: 12, max: 1, text });

export const NEWS_EVENTS = [
  line('newsBridge', 'A new bridge opened across the harbor, cutting the crossing to ten minutes.'),
  line('newsElection', 'The city elected a new mayor after the closest vote in its history.'),
  line('newsComet', 'A comet was visible for a week, and everyone stayed up late to look at it.'),
  line('newsHeatRecord', 'The summer broke the city’s heat record, and the fountains stayed on all night.'),
  line('newsStadium', 'The city’s football team won the championship, and car horns went on until dawn.'),
  line('newsTrain', 'A high-speed train line reached the city, and the old station got a new roof.'),
  line('newsFestival', 'The lantern festival drew its biggest crowd ever this year.'),
  line('newsPark', 'An old factory site became the city’s largest park.'),
  line('newsRobot', 'A local team won an international robotics competition.'),
  line('newsBlackout', 'A blackout darkened half the city for one evening; the stars were spectacular.'),
  line('newsMuseum', 'A new science museum opened downtown with a walk-through volcano.'),
  line('newsMarathon', 'The city marathon was run in the rain, and nobody minded.'),
  line('newsLibrary', 'The public library reopened after a year of renovations with twice the shelves.'),
  line('newsWhale', 'A whale swam into the harbor and stayed for three days before heading back out to sea.'),
  line('newsEclipse', 'A total eclipse crossed the region, and schools closed for the afternoon.'),
];
