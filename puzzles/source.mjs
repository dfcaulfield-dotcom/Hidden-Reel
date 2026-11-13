// Hand-written puzzle source. Run `node scripts/build-puzzles.mjs` to look up
// stills on TMDB and write data/puzzles.json (the file the game loads).
//
// film: [title, year, clue, [three wrong titles], why-it-fits]
// The clue must never name the film. themes[0] is the correct link.

export default [
  {
    themes: ['The story unfolds over a single day or night', 'All set in New York City', 'All directorial debuts', 'All Best Picture winners', 'All adapted from stage plays', 'All shot on a single set'],
    films: [
      ['Die Hard', 1988, "Bruce Willis's New York cop crashes his estranged wife's office Christmas party in a Los Angeles skyscraper, barefoot.", ['Lethal Weapon', 'Speed', 'Under Siege'], 'One Christmas Eve inside Nakatomi Plaza.'],
      ["Ferris Bueller's Day Off", 1986, "John Hughes comedy in which a Chicago teenager fakes an illness, borrows a Ferrari and hijacks a parade float.", ['Risky Business', 'Sixteen Candles', 'Weird Science'], 'One skipped school day in Chicago.'],
      ['Training Day', 2001, "Denzel Washington won his Best Actor Oscar as a corrupt LA narcotics detective breaking in a rookie played by Ethan Hawke.", ['Man on Fire', 'Colors', 'End of Watch'], "The rookie's first, and only, day on the job."],
      ['Before Sunrise', 1995, "Richard Linklater romance: an American and a French student meet on a train and wander Vienna until his flight home.", ['Lost in Translation', 'Reality Bites', 'Midnight in Paris'], 'One night walking around Vienna.'],
      ['Do the Right Thing', 1989, "Spike Lee writes, directs and plays pizza delivery man Mookie on a Brooklyn block during a heatwave.", ['Jungle Fever', 'Boyz n the Hood', 'Mean Streets'], 'The hottest day of the summer.'],
      ['12 Angry Men', 1957, "Henry Fonda is the lone juror holding out for 'not guilty' in a sweltering jury room.", ['Anatomy of a Murder', 'To Kill a Mockingbird', 'Witness for the Prosecution'], 'One afternoon of jury deliberation.'],
    ],
  },
  {
    themes: ['All scored by composer John Williams', 'All directed by Steven Spielberg', 'All produced by George Lucas', 'All based on novels', 'All won the Oscar for Best Visual Effects', 'All set at Christmas'],
    films: [
      ['Jaws', 1975, "The mechanical star of this 1975 blockbuster was nicknamed Bruce, and kept breaking down in the waters off Martha's Vineyard.", ['Piranha', 'The Deep', 'Orca'], 'Two notes were enough to win Williams an Oscar.'],
      ['Star Wars', 1977, "Its opening crawl begins 'It is a period of civil war', and Alec Guinness earned an Oscar nomination as an ageing hermit.", ['Flash Gordon', 'Dune', 'Star Trek: The Motion Picture'], 'The most famous Williams fanfare of all.'],
      ['Home Alone', 1990, "Eight-year-old Kevin defends his suburban Chicago house from the 'Wet Bandits' at Christmas.", ['Problem Child', 'Uncle Buck', 'Jingle All the Way'], "Williams wrote 'Somewhere in My Memory' for it."],
      ['Jurassic Park', 1993, "Based on a Michael Crichton novel, in which Richard Attenborough's tycoon 'spared no expense' on an island attraction.", ['Westworld', 'Congo', 'Godzilla'], 'Williams scored it the same year as Schindler\'s List.'],
      ["Harry Potter and the Sorcerer's Stone", 2001, "Chris Columbus directed this first trip to a British boarding school reached from Platform 9¾.", ['The Golden Compass', 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe', 'Percy Jackson & the Olympians: The Lightning Thief'], "Williams wrote 'Hedwig's Theme', used across the series."],
      ['Superman', 1978, "Christopher Reeve's first outing in the cape; the poster promised 'You'll believe a man can fly'.", ['Batman', 'The Rocketeer', 'Dick Tracy'], 'Its march is another Williams signature.'],
    ],
  },
  {
    themes: ['All built around a heist or robbery', 'All set in Los Angeles', 'All about cops going undercover', 'All remakes of earlier films', 'All based on true stories', 'All directed by British filmmakers'],
    films: [
      ['Heat', 1995, "Michael Mann crime epic that put Al Pacino and Robert De Niro in a scene together for the first time, over coffee.", ['Ronin', 'Casino', 'Collateral'], "De Niro's crew plans one last bank job."],
      ['Inception', 2010, "Leonardo DiCaprio leads a team into a sleeping heir's mind; a spinning top has kept audiences arguing ever since.", ['Shutter Island', 'The Matrix', 'Tenet'], 'A heist in reverse: breaking in to plant an idea.'],
      ['The Italian Job', 1969, "Michael Caine, three Mini Coopers and a Turin traffic jam: 'You're only supposed to blow the bloody doors off!'", ['Get Carter', 'Alfie', 'The Ladykillers'], 'A gold bullion robbery in Turin.'],
      ['Baby Driver', 2017, "Edgar Wright action film whose getaway driver, played by Ansel Elgort, times every chase to his iPod playlist.", ['Drive', 'Hot Fuzz', 'Gone in 60 Seconds'], 'One getaway job after another.'],
      ['Inside Man', 2006, "Spike Lee thriller: Denzel Washington negotiates with Clive Owen, whose crew has sealed off a Manhattan bank.", ['The Negotiator', '25th Hour', 'The Taking of Pelham 123'], "The 'perfect' bank robbery."],
      ['Point Break', 1991, "Kathryn Bigelow sends FBI agent Keanu Reeves undercover among surfers who wear ex-presidents masks to work.", ['Speed', 'Big Wednesday', 'Bad Boys'], 'The surfers fund their summers by robbing banks.'],
    ],
  },
  {
    themes: ['All based on stories by Stephen King', 'All directed by Rob Reiner', 'All set in prisons', 'All Best Picture winners', 'All released in the 1980s', 'All narrated by Morgan Freeman'],
    films: [
      ['The Shining', 1980, "Stanley Kubrick strands Jack Nicholson as the winter caretaker of the Overlook Hotel.", ['The Amityville Horror', 'Poltergeist', 'The Changeling'], "From King's 1977 novel. He famously disliked the film."],
      ['Stand by Me', 1986, "Four boys in 1959 Oregon follow the railway tracks to find a dead body; Richard Dreyfuss narrates.", ['The Goonies', 'The Sandlot', 'My Girl'], "From King's novella 'The Body'."],
      ['The Shawshank Redemption', 1994, "Tim Robbins's banker spends two decades in a Maine prison with a rock hammer and a Rita Hayworth poster.", ['Escape from Alcatraz', 'Cool Hand Luke', 'Dead Man Walking'], "From King's novella 'Rita Hayworth and Shawshank Redemption'."],
      ['Misery', 1990, "Kathy Bates won an Oscar as the 'number one fan' who rescues a novelist from a car wreck.", ['Fatal Attraction', 'Fried Green Tomatoes', 'The Hand That Rocks the Cradle'], "From King's 1987 novel."],
      ['Carrie', 1976, "Brian De Palma horror starring Sissy Spacek, ending in cinema's most disastrous prom night.", ['Halloween', 'Prom Night', 'The Exorcist'], "From King's first published novel."],
      ['The Green Mile', 1999, "Tom Hanks is a Depression-era death-row guard who meets a gentle giant with a healing gift.", ['Sling Blade', 'The Hurricane', 'Forrest Gump'], "From King's six-part serial novel."],
    ],
  },
  {
    themes: ['All told out of chronological order', 'All directed by Christopher Nolan', 'All shot in black and white', 'All directorial debuts', 'All set in Los Angeles', 'All won the Oscar for Best Original Screenplay'],
    films: [
      ['Pulp Fiction', 1994, "Palme d'Or winner featuring a glowing briefcase, a five-dollar milkshake and a twist contest at Jack Rabbit Slim's.", ['Jackie Brown', 'Get Shorty', 'True Romance'], 'Its three stories are shuffled, and it ends in the middle.'],
      ['Memento', 2000, "Guy Pearce hunts his wife's killer using Polaroids and tattoos, because he can't form new memories.", ['Insomnia', 'The Machinist', 'Fight Club'], 'Its colour scenes run backwards.'],
      ['(500) Days of Summer', 2009, "Joseph Gordon-Levitt's greeting-card writer falls for Zooey Deschanel; the narrator warns 'this is not a love story'.", ['Garden State', 'Ruby Sparks', 'Yes Man'], 'It jumps around the 500 days by number.'],
      ['Eternal Sunshine of the Spotless Mind', 2004, "Charlie Kaufman script in which Jim Carrey hires a firm called Lacuna to wipe Kate Winslet from his memory.", ['Being John Malkovich', 'Vanilla Sky', 'The Truman Show'], 'The romance plays in reverse as memories are erased.'],
      ['Dunkirk', 2017, "A 2017 account of a 1940 evacuation, told from land, sea and air with very little dialogue.", ['1917', 'Darkest Hour', 'Saving Private Ryan'], 'A week, a day and an hour are interwoven.'],
      ['Citizen Kane', 1941, "Orson Welles's first film, in which a reporter tries to decode a dying tycoon's last word.", ['The Magnificent Ambersons', 'Sunset Boulevard', "It's a Wonderful Life"], 'A life pieced together from overlapping flashbacks.'],
    ],
  },
  {
    themes: ['All remakes of earlier films', 'All set in Florida', 'All based on true stories', 'All directorial debuts', 'All Best Picture winners', 'All adapted from Broadway musicals'],
    films: [
      ['The Departed', 2006, "Martin Scorsese finally won his directing Oscar for this Boston tale of a mole in the police and a mole in the mob.", ['Mystic River', 'The Town', 'Gangs of New York'], "A remake of Hong Kong's Infernal Affairs (2002)."],
      ["Ocean's Eleven", 2001, "Steven Soderbergh sends George Clooney and Brad Pitt after three Las Vegas casinos in one night.", ['Casino', 'The Score', 'Snatch'], 'A remake of the 1960 Rat Pack film.'],
      ['Scarface', 1983, "Al Pacino's Cuban refugee rises through Miami's cocaine trade: 'Say hello to my little friend!'", ["Carlito's Way", 'Goodfellas', 'Blow'], "A remake of Howard Hawks's 1932 gangster film."],
      ['The Birdcage', 1996, "Robin Williams and Nathan Lane run a South Beach drag club and must impress a conservative senator played by Gene Hackman.", ['Mrs. Doubtfire', 'In & Out', 'To Wong Foo, Thanks for Everything! Julie Newmar'], 'A remake of La Cage aux Folles (1978).'],
      ['A Star Is Born', 2018, "Bradley Cooper's first film as director, with Lady Gaga singing the Oscar-winning 'Shallow'.", ['Crazy Heart', 'La La Land', 'Bohemian Rhapsody'], 'The fourth version of a story first filmed in 1937.'],
      ['The Fly', 1986, "David Cronenberg body horror: Jeff Goldblum's scientist tests his teleportation pods on himself. 'Be afraid. Be very afraid.'", ['Scanners', 'Re-Animator', 'Altered States'], 'A remake of the 1958 Vincent Price film.'],
    ],
  },
  {
    themes: ['One actor plays more than one character', 'All feature time travel', 'All sequels', 'All directed by their star', 'All based on TV sketches', 'All remakes of earlier films'],
    films: [
      ['Dr. Strangelove', 1964, "Stanley Kubrick's Cold War satire: 'Gentlemen, you can't fight in here! This is the War Room!'", ['Fail Safe', 'The Manchurian Candidate', 'M*A*S*H'], 'Peter Sellers plays three roles.'],
      ['The Nutty Professor', 1996, "Eddie Murphy's Professor Sherman Klump invents a slimming formula and unleashes Buddy Love.", ['Doctor Dolittle', 'Flubber', "Big Momma's House"], 'Murphy plays seven characters, including most of the Klump family.'],
      ['The Parent Trap', 1998, "Nancy Meyers's first film as director: two girls meet at summer camp and plot to reunite their divorced parents.", ['It Takes Two', 'Freaky Friday', 'Father of the Bride'], 'Lindsay Lohan plays both twins.'],
      ['Austin Powers: International Man of Mystery', 1997, "A cryogenically frozen 1960s British spy thaws in the '90s to face a villain demanding 'one million dollars'.", ['Johnny English', 'Spy Hard', "Wayne's World"], 'Mike Myers plays both Austin and Dr. Evil.'],
      ['The Social Network', 2010, "David Fincher and Aaron Sorkin's account of a Harvard dorm-room startup and the lawsuits that followed.", ['Steve Jobs', 'Moneyball', 'The Big Short'], 'Armie Hammer plays both Winklevoss twins.'],
      ['Back to the Future Part II', 1989, "Sequel featuring hoverboards, self-lacing sneakers and a sports almanac, set partly in 2015.", ["Bill & Ted's Excellent Adventure", 'Honey, I Shrunk the Kids', 'Total Recall'], 'Michael J. Fox plays Marty, his son and his daughter.'],
    ],
  },
  {
    themes: ['All road trip movies', 'All Best Picture winners', 'All based on true stories', 'All set at Thanksgiving or Christmas', 'All buddy-cop comedies', 'All directed by brothers'],
    films: [
      ['Little Miss Sunshine', 2006, "A family pushes a broken yellow VW bus towards a California children's beauty pageant; Alan Arkin won an Oscar.", ['Juno', 'The Royal Tenenbaums', 'Captain Fantastic'], 'Albuquerque to Redondo Beach by VW bus.'],
      ['Thelma & Louise', 1991, "Ridley Scott directs Geena Davis and Susan Sarandon in a 1966 Thunderbird, with an early role for Brad Pitt.", ['A League of Their Own', 'Boys on the Side', 'Wild at Heart'], 'A weekend getaway that turns into a run for Mexico.'],
      ['Rain Man', 1988, "Best Picture winner: Tom Cruise discovers a brother who refuses to fly and must be back in time for Judge Wapner.", ['Awakenings', 'Cocktail', 'Scent of a Woman'], 'Cincinnati to Los Angeles in a 1949 Buick.'],
      ['Planes, Trains and Automobiles', 1987, "Steve Martin just wants to get home to Chicago for Thanksgiving; John Candy sells shower curtain rings.", ['The Great Outdoors', 'Trading Places', 'Parenthood'], 'New York to Chicago, the long way.'],
      ['Dumb and Dumber', 1994, "Jim Carrey and Jeff Daniels drive a dog-shaped van to Aspen to return a briefcase.", ['Ace Ventura: Pet Detective', 'Billy Madison', "There's Something About Mary"], 'Providence to Aspen in the Mutt Cutts van.'],
      ['Green Book', 2018, "Best Picture winner with Viggo Mortensen as a bouncer chauffeuring pianist Mahershala Ali in 1962.", ['Driving Miss Daisy', 'The Help', 'Hidden Figures'], 'A concert tour through the Deep South.'],
    ],
  },
  {
    themes: ['Set almost entirely in one location', 'All directed by Alfred Hitchcock', 'All based on true stories', 'All have no musical score', 'All set in New York City', 'All have a single credited actor'],
    films: [
      ['Rear Window', 1954, "Hitchcock thriller: James Stewart, laid up with a broken leg, passes the time watching his neighbours through a telephoto lens.", ['Vertigo', 'North by Northwest', 'Strangers on a Train'], 'We never leave the apartment and its courtyard.'],
      ['The Breakfast Club', 1985, "A brain, an athlete, a basket case, a princess and a criminal serve Saturday detention.", ["St. Elmo's Fire", 'Pretty in Pink', 'Fast Times at Ridgemont High'], 'One school library.'],
      ['Panic Room', 2002, "David Fincher thriller with Jodie Foster and a young Kristen Stewart hiding from burglars in their new Manhattan home.", ['Flightplan', 'The Game', 'Red Eye'], 'One brownstone, mostly one room.'],
      ['Phone Booth', 2003, "Colin Farrell answers a ringing public phone in Manhattan and is told he'll be shot if he hangs up.", ['Cellular', 'Collateral', 'S.W.A.T.'], 'One phone booth on 53rd Street.'],
      ['Clue', 1985, "Tim Curry's butler hosts a murderous dinner party in this comedy based on a board game, released with three different endings.", ['Spaceballs', 'Young Frankenstein', 'Murder on the Orient Express'], 'One mansion on a stormy night.'],
      ['Buried', 2010, "Ryan Reynolds is the only actor on screen: a truck driver in Iraq who wakes up underground with a mobile phone.", ['127 Hours', 'The Hurt Locker', 'Green Zone'], 'One coffin, for the entire running time.'],
    ],
  },
  {
    themes: ["There's a number in every title", 'All science fiction', 'All have twist endings', 'All directed by David Fincher', 'All based on true stories', 'All set in space'],
    films: [
      ['Se7en', 1995, "David Fincher's rain-soaked thriller with Brad Pitt and Morgan Freeman: 'What's in the box?'", ['Zodiac', 'The Bone Collector', 'Kiss the Girls'], 'Seven.'],
      ['The Sixth Sense', 1999, "M. Night Shyamalan's breakthrough: 'I see dead people.'", ['Unbreakable', 'The Others', 'Stir of Echoes'], 'Six.'],
      ['Apollo 13', 1995, "Ron Howard dramatises a 1970 NASA mission: 'Houston, we have a problem.'", ['The Right Stuff', 'Gravity', 'First Man'], 'Thirteen.'],
      ['District 9', 2009, "Neill Blomkamp's first feature: stranded aliens nicknamed 'prawns' are confined to a Johannesburg camp.", ['Elysium', 'Cloverfield', 'Children of Men'], 'Nine.'],
      ['2001: A Space Odyssey', 1968, "Stanley Kubrick science fiction: 'I'm sorry, Dave. I'm afraid I can't do that.'", ['Solaris', 'Silent Running', 'Planet of the Apes'], 'Two thousand and one.'],
      ['8 Mile', 2002, "Eminem plays a Detroit factory worker in rap battles; 'Lose Yourself' won the Oscar.", ['Hustle & Flow', "Get Rich or Die Tryin'", 'Straight Outta Compton'], 'Eight.'],
    ],
  },
];
