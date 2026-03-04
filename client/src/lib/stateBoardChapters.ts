export interface StateBoardBookInfo {
  bookName: string;
  publisher: string;
  chapters: string[];
}

export const STATE_BOARDS = [
  { value: "Maharashtra", label: "Maharashtra State Board (Balbharati)" },
  { value: "Andhra Pradesh", label: "Andhra Pradesh State Board (SCERT AP)" },
  { value: "Tamil Nadu", label: "Tamil Nadu State Board (Samacheer Kalvi)" },
] as const;

export const STATE_BOARD_CHAPTER_DATA: Record<string, Record<string, Record<string, StateBoardBookInfo[]>>> = {
  "Maharashtra": {
    "Grade 1": {
      "Mathematics": [{
        bookName: "My Math (Std 1)",
        publisher: "Balbharati",
        chapters: ["Shapes", "Numbers 1 to 9", "Serial Order", "Addition", "Subtraction", "Numbers 10 to 20", "Measurement", "Numbers 1 to 50", "Time", "Money", "Data Handling", "Patterns"],
      }],
      "English": [{
        bookName: "My English Book (Std 1)",
        publisher: "Balbharati",
        chapters: ["Hello!", "My Family", "My School", "Animals", "Fruits and Vegetables", "Good Habits", "Colours", "My Body", "Birds", "Transport", "Festivals"],
      }],
      "Marathi": [{
        bookName: "Balbharati Marathi (Std 1)",
        publisher: "Balbharati",
        chapters: ["माझं घर", "माझी शाळा", "प्राणी", "फळे आणि भाज्या", "माझे शरीर", "पक्षी", "रंग", "सवयी", "वाहतूक", "सण"],
      }],
    },
    "Grade 2": {
      "Mathematics": [{
        bookName: "My Math (Std 2)",
        publisher: "Balbharati",
        chapters: ["Numbers 1 to 100", "Addition with Carrying", "Subtraction with Borrowing", "Multiplication Tables 2 to 5", "Division Introduction", "Shapes and Patterns", "Measurement of Length", "Measurement of Weight", "Capacity", "Time", "Money", "Data Handling"],
      }],
      "English": [{
        bookName: "My English Book (Std 2)",
        publisher: "Balbharati",
        chapters: ["Hello Friends", "My Family and I", "At School", "In the Garden", "The Kind Boy", "Food We Eat", "Our Helpers", "Water", "Seasons", "Our Country", "Stories and Poems"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 2)",
        publisher: "Balbharati",
        chapters: ["My Family", "Our School", "Parts of Body and Cleanliness", "Food", "Water", "Clothes", "Animals and Birds", "Trees and Plants", "Travel and Transport", "Festivals", "Our Helpers", "Our Country"],
      }],
    },
    "Grade 3": {
      "Mathematics": [{
        bookName: "My Math (Std 3)",
        publisher: "Balbharati",
        chapters: ["Numbers up to 999", "Addition and Subtraction", "Multiplication Tables up to 10", "Division", "Fractions Introduction", "Shapes and Spatial Understanding", "Measurement of Length", "Measurement of Weight and Capacity", "Time", "Money", "Patterns", "Data Handling"],
      }],
      "English": [{
        bookName: "My English Book (Std 3)",
        publisher: "Balbharati",
        chapters: ["A Stormy Day", "The Ant and the Grasshopper", "Saving the Tree", "The Clever Fox", "Poems for Children", "Festivals of India", "Good Deeds", "The Honest Woodcutter", "Unity is Strength", "The Sun and the Wind", "Environmental Awareness"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 3)",
        publisher: "Balbharati",
        chapters: ["Our Family", "My Body", "Safety and First Aid", "Food and Nutrition", "Water", "Air", "Clothes and Fibres", "Shelter", "Occupations", "Plants", "Animals", "Transport and Communication", "Our Country", "Festivals and National Days"],
      }],
    },
    "Grade 4": {
      "Mathematics": [{
        bookName: "My Math (Std 4)",
        publisher: "Balbharati",
        chapters: ["Numbers up to 10,000", "Addition and Subtraction of Large Numbers", "Multiplication", "Division", "Fractions", "Decimals Introduction", "Geometry - Lines and Angles", "Perimeter", "Area", "Patterns", "Measurement", "Data Handling", "Time and Calendar"],
      }],
      "English": [{
        bookName: "My English Book (Std 4)",
        publisher: "Balbharati",
        chapters: ["The Dog and the Bone", "Belling the Cat", "The Tortoise and the Hare", "My India", "The Thirsty Crow", "Pinocchio", "A Rainy Day", "Books Are Our Friends", "Poems and Rhymes", "Stories of Wisdom", "Environmental Stories"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 4)",
        publisher: "Balbharati",
        chapters: ["Living Things", "Plants – Structure and Function", "Adaptation in Animals", "Food Chain", "Water – Sources and Conservation", "Air and Weather", "Rocks and Soil", "Our Body – Organs", "Safety Rules", "Maps and Directions", "Maharashtra – Our State", "Transport and Communication"],
      }],
    },
    "Grade 5": {
      "Mathematics": [{
        bookName: "My Math (Std 5)",
        publisher: "Balbharati",
        chapters: ["Numbers up to 10 Lakh", "Roman Numerals", "Addition and Subtraction", "Multiplication and Division", "Fractions", "Decimals", "Unitary Method", "Geometry – Angles", "Perimeter and Area", "Volume", "Patterns", "Data Handling", "Time and Work"],
      }],
      "English": [{
        bookName: "My English Book (Std 5)",
        publisher: "Balbharati",
        chapters: ["What a Bird Thought", "Daydreams", "Be a Good Listener", "Strawberries", "The Twelve Months", "Announcements", "Major Dhyan Chand", "Peer Profile", "The Triantiwontigongolope", "Three Sacks of Rice", "Be a Good Speaker", "Count your Garden", "The Adventures of Gulliver", "A Lesson for All", "Bird Bath", "Write your own Story", "On the Water", "Weeds in the Garden", "Be a Good Host and Guest", "Only One Mother"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 5)",
        publisher: "Balbharati",
        chapters: ["Our Earth and Our Solar System", "Natural Resources", "Adaptations in Animals", "Adaptations in Plants", "Substances, Materials and Energy", "Our Body", "Diseases and Prevention", "Food and Nutrition", "Maps", "Maharashtra – Physical Features", "Water Cycle", "Environmental Conservation"],
      }],
    },
    "Grade 6": {
      "Mathematics": [{
        bookName: "Mathematics (Std 6)",
        publisher: "Balbharati",
        chapters: ["Basic Concepts in Geometry", "Angles", "Integers", "Operations on Fractions", "Decimal Fractions", "Bar Graphs", "Symmetry", "Divisibility", "HCF-LCM", "Equations", "Ratio and Proportion", "Percentage", "Profit – Loss", "Banks and Simple Interest", "Triangles and Their Properties", "Quadrilaterals", "Geometrical Constructions", "Three Dimensional Shapes"],
      }],
      "English": [{
        bookName: "English Balbharati (Std 6)",
        publisher: "Balbharati",
        chapters: ["Don't Give Up!", "Who's the Greatest?", "Autobiography of a Great Indian Bustard", "Children are Going to School...", "A Kabaddi Match", "The Peacock and the Crane", "Param Vir Chakra: Our Heroes", "The Clothesline", "The Worth of a Fabric", "A Wall Magazine for your Class!", "Anak Krakatoa", "The Silver House", "Ad'wise' Customers", "Yonamine and Bushi", "It Can Be Done", "The Merchant and the Elephants", "The Little Bird", "The Old Clock", "The Cloud", "Basket of Brinjals", "A Needle Can Dig a Well"],
      }],
      "General Science": [{
        bookName: "General Science (Std 6)",
        publisher: "Balbharati",
        chapters: ["Natural Resources – Air, Water and Land", "The Living World", "Diversity in Living Things and Their Classification", "Disaster Management", "Substances in the Surroundings – Their States and Properties", "Substances in Daily Use", "Nutrition and Diet", "Our Skeletal System and the Skin", "Motion and Types of Motion", "Force and Types of Force", "Work and Energy", "Simple Machines", "Sound", "Light and the Formation of Shadows", "Fun with Magnets", "The Universe"],
      }],
      "History": [{
        bookName: "History and Civics (Std 6)",
        publisher: "Balbharati",
        chapters: ["The Indian Subcontinent and History", "Sources of History", "The Harappan Civilization", "Our Life in Society", "The Vedic Civilization", "Religious Trends in Ancient India", "Janapadas and Mahajanapadas", "India during the Maurya Period", "Diversity in Society", "States after the Maurya Empire", "Ancient Kingdoms of the South", "Rural Local Government Bodies", "Ancient India: Cultural", "Ancient India and the World"],
      }],
      "Geography": [{
        bookName: "Geography (Std 6)",
        publisher: "Balbharati",
        chapters: ["The Earth and the Graticule", "Let us Use the Graticule", "Comparing a Globe and a Map; Field Visits", "Weather and Climate", "Temperature", "Importance of Oceans", "Rocks and Rock Types", "Natural Resources", "Energy Resources", "Human Occupations"],
      }],
    },
    "Grade 7": {
      "Mathematics": [{
        bookName: "Mathematics (Std 7)",
        publisher: "Balbharati",
        chapters: ["Geometrical Constructions", "Multiplication and Division of Integers", "HCF and LCM", "Angles and A Pair of Angles", "Operations on Rational Numbers", "Indices", "Joint Bar Graph", "Algebraic Expressions and Operations on Them", "Direct Proportion and Inverse Proportion", "Banks and Simple Interest", "Circle", "Perimeter and Area", "Pythagoras' Theorem", "Algebraic Formulae – Expansion of Squares", "Statistics"],
      }],
      "English": [{
        bookName: "English Balbharati (Std 7)",
        publisher: "Balbharati",
        chapters: ["Past, Present, Future", "Odd One In", "In Time of Silver Rain", "The King's Choice", "Seeing Eyes Helping Hands", "A Collage", "From a Railway Carriage", "The Souvenir", "Abdul Becomes a Courtier", "How Doth the Little Busy Bee", "Learn Yoga from Animals", "Chasing the Sea Monster", "Great Scientists", "Tartary", "Compere a Programme", "A Crow in the House", "The Brook", "News Analysis", "Think Before You Speak!"],
      }],
      "General Science": [{
        bookName: "General Science (Std 7)",
        publisher: "Balbharati",
        chapters: ["The Living World: Adaptations and Classification", "Plants: Structure and Function", "Properties of Natural Resources", "Nutrition in Living Organisms", "Food Safety", "Measurement of Physical Quantities", "Motion, Force and Work", "Static Electricity", "Heat", "Disaster Management", "Cell Structure and Micro-organisms", "The Muscular System and Digestive System in Human Beings", "Changes – Physical and Chemical", "Elements, Compounds and Mixtures", "Properties of a Magnetic Field", "Sound: Production of Sound", "Properties of Light", "Transmission of Sound", "Stars and the Solar System", "Earth – Our Special Planet"],
      }],
      "History": [{
        bookName: "History and Civics (Std 7)",
        publisher: "Balbharati",
        chapters: ["Medieval India", "India – The Delhi Sultanate", "The Mughal Empire", "The Maratha Empire – Shivaji Maharaj", "Administration of Shivaji Maharaj", "Peshwa Period", "The British in India", "Socio-Religious Reforms", "First War of Independence 1857", "Social and Religious Awakening"],
      }],
      "Geography": [{
        bookName: "Geography (Std 7)",
        publisher: "Balbharati",
        chapters: ["Landforms", "Weather and Climate", "Natural Vegetation and Wildlife", "Soils", "Agriculture in India", "Industries in India", "Population", "Transportation and Communication", "Maharashtra – Physical Features", "Maharashtra – Climate and Vegetation"],
      }],
    },
    "Grade 8": {
      "Mathematics": [{
        bookName: "Mathematics (Std 8)",
        publisher: "Balbharati",
        chapters: ["Rational and Irrational Numbers", "Parallel Lines and Transversals", "Indices and Cube Root", "Altitudes and Medians of a Triangle", "Expansion Formulae", "Factorisation of Algebraic Expressions", "Variation", "Quadrilateral: Constructions and Types", "Discount and Commission", "Division of Polynomials", "Statistics", "Equations in One Variable", "Congruence of Triangles", "Compound Interest", "Area", "Surface Area and Volume", "Circle: Chord and Arc"],
      }],
      "English": [{
        bookName: "English Balbharati (Std 8)",
        publisher: "Balbharati",
        chapters: ["A Time To Believe", "Dick Whittington and his Cat", "The Pilgrim", "Revathi's Musical Plants", "Vocation", "Nature Created Man and Woman as Equals", "The Worm", "Three Visions for India", "The Happy Prince", "The Plate of Gold", "The Kite Festival", "The Last Leaf", "Leisure", "The Vet", "Revolutionary Steps in Surgery", "The Bees", "Ramanujan", "A Battle to Baffle"],
      }],
      "General Science": [{
        bookName: "General Science (Std 8)",
        publisher: "Balbharati",
        chapters: ["Living World and Classification of Microbes", "Health and Diseases", "Force and Pressure", "Current Electricity and Magnetism", "Inside the Atom", "Composition of Matter", "Metals and Nonmetals", "Pollution", "Disaster Management", "Cell and Cell Organelles", "Human Body and Organ System", "Introduction to Acid and Base", "Chemical Change and Chemical Bond", "Measurement and Effects of Heat", "Sound", "Reflection of Light", "Man-made Materials", "Ecosystems", "Life Cycle of Stars"],
      }],
    },
    "Grade 9": {
      "Mathematics": [
        {
          bookName: "Mathematics Part I – Algebra (Std 9)",
          publisher: "Balbharati",
          chapters: ["Sets", "Real Numbers", "Polynomials", "Ratio and Proportion", "Linear Equations in Two Variables", "Financial Planning", "Statistics"],
        },
        {
          bookName: "Mathematics Part II – Geometry (Std 9)",
          publisher: "Balbharati",
          chapters: ["Basic Concepts in Geometry", "Parallel Lines", "Triangles", "Constructions of Triangles", "Quadrilaterals", "Circle", "Co-ordinate Geometry", "Trigonometry", "Surface Area and Volume"],
        },
      ],
      "English": [{
        bookName: "English Kumarbharati (Std 9)",
        publisher: "Balbharati",
        chapters: ["Life", "A Synopsis – The Swiss Family Robinson", "Have you ever seen...?", "Have you thought of the verb 'have'...", "The Necklace", "Invictus", "A True Story of Sea Turtles", "Somebody's Mother", "The Fall of Troy", "Autumn", "The Past in the Present", "The Road Not Taken", "Tansen", "Silver", "Reading Works of Art", "Please Listen!", "Think Before You Speak!"],
      }],
      "Science": [{
        bookName: "Science and Technology (Std 9)",
        publisher: "Balbharati",
        chapters: ["Laws of Motion", "Work and Energy", "Current Electricity", "Measurement of Matter", "Acids, Bases and Salts", "Classification of Plants", "Energy Flow in an Ecosystem", "Useful and Harmful Microbes", "Environmental Management", "Information Communication Technology (ICT)", "Reflection of Light", "Study of Sound", "Carbon: An Important Element", "Substances in Common Use", "Life Processes in Living Organisms", "Heredity and Variation", "Introduction to Biotechnology", "Observing Space: Telescopes"],
      }],
    },
    "Grade 10": {
      "Mathematics": [
        {
          bookName: "Mathematics Part I – Algebra (Std 10)",
          publisher: "Balbharati",
          chapters: ["Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progression", "Financial Planning", "Probability", "Statistics"],
        },
        {
          bookName: "Mathematics Part II – Geometry (Std 10)",
          publisher: "Balbharati",
          chapters: ["Similarity", "Pythagoras Theorem", "Circle", "Geometric Constructions", "Co-ordinate Geometry", "Trigonometry", "Mensuration"],
        },
      ],
      "English": [{
        bookName: "English Kumarbharati (Std 10)",
        publisher: "Balbharati",
        chapters: ["Where the Mind is Without Fear", "The Thief's Story", "On Wings of Courage", "All the World's a Stage", "Joan of Arc", "The Alchemy of Nature", "Animals", "Three Questions", "Connecting the Dots", "The Pulley", "Let's March", "Science and Spirituality", "Night of the Scorpion", "The Night I Met Einstein", "Stephen Hawking", "The Will to Win", "Unbeatable Super Mom – Mary Kom", "The Concert", "A Thing of Beauty is a Joy For Ever", "The Luncheon", "World Heritage", "The Height of the Ridiculous", "Build a Wall", "His First Flight"],
      }],
      "Science": [
        {
          bookName: "Science and Technology Part 1 (Std 10)",
          publisher: "Balbharati",
          chapters: ["Gravitation", "Periodic Classification of Elements", "Chemical Reactions and Equations", "Effects of Electric Current", "Heat", "Refraction of Light", "Lenses", "Metallurgy", "Carbon Compounds", "Space Missions"],
        },
        {
          bookName: "Science and Technology Part 2 (Std 10)",
          publisher: "Balbharati",
          chapters: ["Heredity and Evolution", "Life Processes in Living Organisms Part-1", "Life Processes in Living Organisms Part-2", "Environmental Management", "Towards Green Energy", "Animal Classification", "Introduction to Microbiology", "Cell Biology and Biotechnology", "Social Health", "Disaster Management"],
        },
      ],
    },
  },
  "Andhra Pradesh": {
    "Grade 1": {
      "Mathematics": [{
        bookName: "Mathematics (Class 1)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Shapes and Space", "Numbers from 1 to 9", "Addition", "Subtraction", "Numbers from 10 to 20", "Time", "Measurement", "Numbers up to 50", "Data Handling", "Patterns", "Money"],
      }],
      "English": [{
        bookName: "English Reader (Class 1)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Hello!", "My Family", "My School", "Animals", "Fruits", "Good Habits", "Colours", "My Body", "Birds", "Transport"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Class 1)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["My Family", "My School", "Food We Eat", "Animals and Birds", "Plants Around Us", "Water", "Transport", "Festivals"],
      }],
    },
    "Grade 2": {
      "Mathematics": [{
        bookName: "Mathematics (Class 2)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Numbers up to 100", "Addition", "Subtraction", "Multiplication Introduction", "Shapes", "Measurement", "Time", "Money", "Data Handling", "Patterns"],
      }],
      "English": [{
        bookName: "English Reader (Class 2)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["My Friends", "In the Garden", "At the Market", "The Little Plant", "Good Manners", "Stories for Children", "Seasons", "Our Country", "Poems and Rhymes"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Class 2)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["My Family and Neighbourhood", "Our School", "Food and Health", "Water", "Animals", "Plants", "Travel", "Festivals and National Days"],
      }],
    },
    "Grade 3": {
      "Mathematics": [{
        bookName: "Mathematics (Class 3)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Numbers up to 999", "Addition and Subtraction", "Multiplication", "Division", "Fractions", "Measurement of Length", "Weight and Capacity", "Time", "Money", "Geometry – Shapes", "Patterns", "Data Handling"],
      }],
      "English": [{
        bookName: "English Reader (Class 3)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["A Happy Family", "The Fox and the Grapes", "In the Zoo", "Our Helpers", "The Honest Woodcutter", "Stories of Animals", "Poems for Fun", "My Country India", "Good Deeds"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Class 3)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Family and Relationships", "My Body", "Food and Nutrition", "Water Sources", "Air Around Us", "Plants and Their Parts", "Animals and Their Homes", "Transport and Communication", "Festivals of India", "Safety Rules"],
      }],
    },
    "Grade 4": {
      "Mathematics": [{
        bookName: "Mathematics (Class 4)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Numbers up to 10,000", "Addition and Subtraction", "Multiplication", "Division", "Fractions", "Decimals", "Geometry – Lines and Angles", "Perimeter and Area", "Measurement", "Time", "Money", "Data Handling", "Patterns"],
      }],
      "English": [{
        bookName: "English Reader (Class 4)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["The Greedy Dog", "Birbal's Wisdom", "The Magic Fish", "My Country", "The Clever Monkey", "The Golden Egg", "Poems and Stories", "Our Helpers in Society", "Save the Environment"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Class 4)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Living Things and Non-living Things", "Plants – Structure and Functions", "Animals – Adaptation", "Food Chain and Web", "Water Conservation", "Air and Weather", "Our Body – Systems", "Rocks and Soil", "Maps and Directions", "Transport", "Our State – Andhra Pradesh"],
      }],
    },
    "Grade 5": {
      "Mathematics": [{
        bookName: "Mathematics (Class 5)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Large Numbers", "Addition and Subtraction", "Multiplication and Division", "Fractions", "Decimals", "Percentage", "Geometry – Lines, Angles, Shapes", "Perimeter and Area", "Volume", "Data Handling", "Patterns", "Time and Work"],
      }],
      "English": [{
        bookName: "English Reader (Class 5)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["The River", "The Boy Who Saved a City", "Kindness Matters", "Our National Heroes", "A Trip to the Forest", "Poems of Nature", "Festivals of Andhra Pradesh", "Stories of Courage", "Be Eco-Friendly", "Reading Comprehension"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Class 5)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Our Earth and Solar System", "Natural Resources", "Adaptations in Animals", "Adaptations in Plants", "Matter and Materials", "Our Body – Organs and Systems", "Diseases and Prevention", "Food and Nutrition", "Maps – Andhra Pradesh", "Water Resources", "Environmental Conservation"],
      }],
    },
    "Grade 6": {
      "Mathematics": [{
        bookName: "Mathematics (Class 6)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Numbers", "Playing with Numbers", "Whole Numbers", "Integers", "Fractions – Decimals", "Basic Arithmetic", "Introduction to Algebra", "Geometric Concepts", "2D and 3D Shapes", "Practical Geometry", "Perimeter and Area", "Data Handling"],
      }],
      "English": [{
        bookName: "English (Class 6)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["The Lost Casket", "Rip Van Winkle", "Half the Price", "The Enchanted Pool", "Robin Hood and the Golden Arrow", "Dr. B.R. Ambedkar", "Poems and Comprehension", "Grammar and Composition"],
      }],
      "General Science": [{
        bookName: "General Science (Class 6)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Our Food", "Know About Plants", "Animals – Food", "Sorting Materials into Groups", "Materials – Separation Methods", "Fun with Magnets", "Let's Measure", "How Clothes are Made", "Living Organisms – Habitat", "Body Movements", "Electric Circuits", "Water – A Precious Resource"],
      }],
      "Social Studies": [{
        bookName: "Social Studies (Class 6)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Our Earth in the Solar System", "Globe – Model of the Earth", "Maps", "Land Forms – Andhra Pradesh", "Early Life to Settled Life", "Early Civilisations", "Emergence of Kingdoms and Republics", "Kingdoms and Empires", "Government", "Local Self Government", "Indian Culture, Languages and Religions", "Towards Equality"],
      }],
    },
    "Grade 7": {
      "Mathematics": [{
        bookName: "Mathematics (Class 7)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Integers", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles", "The Triangle and its Properties", "Congruence of Triangles", "Comparing Quantities", "Rational Numbers", "Perimeter and Area", "Algebraic Expressions", "Exponents and Powers", "Symmetry", "Visualizing Solid Shapes"],
      }],
      "English": [{
        bookName: "English (Class 7)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["The Town Mouse and the Country Mouse", "The Town Child & The Country Child", "The New Blue Dress", "C.V. Raman, the Pride of India", "It's Change...", "Susruta, an Ancient Plastic Surgeon", "Puru, the Brave", "Home They Brought Her Warrior Dead", "The Magic of Silk", "Tenali Paints a Horse", "Dear Mum", "The Emperor's New Clothes", "A Trip to Andaman", "My Trip to the Moon", "Sindbad, the Sailor", "Snakes in India"],
      }],
      "General Science": [{
        bookName: "General Science (Class 7)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Nutrition in Plants", "Nutrition in Animals", "Heat", "Acids, Bases and Salts", "Physical and Chemical Changes", "Fibre to Fabric", "Weather, Climate and Adaptations", "Winds, Storms and Cyclones", "Soil", "Respiration in Organisms", "Transportation in Animals and Plants", "Reproduction in Plants", "Motion and Time", "Electric Current and Its Effects", "Light", "Water – A Precious Resource", "Forests – Our Lifeline", "Waste Water Story"],
      }],
      "Social Studies": [{
        bookName: "Social Studies (Class 7)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Reading Maps of Different Kinds", "The Earth – Our Habitat", "Our Environment", "Emergence of Medieval Kingdoms", "The Delhi Sultanate", "The Mughal Empire", "Socio-Religious Movements", "Art and Architecture", "Markets Around Us", "Women Changing the World", "Democracy and Equality", "Political Institutions"],
      }],
    },
    "Grade 8": {
      "Mathematics": [{
        bookName: "Mathematics (Class 8)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry", "Exponents and Powers", "Comparing Quantities using Proportion", "Square Roots and Cube Roots", "Algebraic Expressions", "Exploring Geometrical Figures", "Area of Plane Figures", "Direct and Inverse Proportions", "Factorisation", "Visualising Solid Shapes", "Frequency Distribution Tables and Graphs", "Playing with Numbers"],
      }],
      "English": [{
        bookName: "English (Class 8)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["The Best Christmas Present in the World", "My Mother", "The Tattered Blanket", "The Cry of Children", "Reaching the Unreached", "Oliver Asks for More", "The Selfish Giant Part 1", "The Selfish Giant Part 2", "The Garden Within", "The Story of Ikat", "The Earthen Goblet", "Maestro with a Mission"],
      }],
      "Physical Science": [{
        bookName: "Physical Science (Class 8)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Force", "Friction", "Sound", "Synthetic Fibers and Plastics", "Metals and Non-metals", "Chemical Effects of Electric Current", "Coal and Petroleum", "Combustion, Fuels and Flame", "Electrical Conductivity of Liquids", "Reflection of Light at Plane Surfaces", "Light", "Stars – Solar System"],
      }],
      "Biological Science": [{
        bookName: "Biological Science (Class 8)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Cell – The Basic Unit of Life", "Microbial World", "Synthetic Fibres and Plastics", "Crop Production and Management", "Reproduction in Animals", "Reaching the Age of Adolescence", "Conservation of Plants and Animals", "Biodiversity and Its Conservation"],
      }],
      "Social Studies": [{
        bookName: "Social Studies (Class 8)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["The French Revolution", "Europe – Napoleon", "Colonialism in Latin America", "The Modern World", "Industrialisation and Social Change", "Revolts of 1857", "National Movement – The Early Phase", "National Movement – Towards Freedom", "The Indian Constitution", "Parliamentary Government", "The Judiciary", "Resources", "Agriculture", "Industries", "Globalisation"],
      }],
    },
    "Grade 9": {
      "Mathematics": [{
        bookName: "Mathematics (Class 9)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Number System", "Polynomials", "Co-ordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid's Geometry", "Lines and Angles", "Proofs in Mathematics", "Triangles", "Quadrilaterals", "Circles", "Heron's Formula", "Surface Areas and Volumes", "Statistics", "Geometrical Constructions"],
      }],
      "English": [{
        bookName: "English (Class 9)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["The Snake and the Mirror", "The Duck and the Kangaroo", "Little Bobby", "True Height", "What is a Player?", "V.V.S. Laxman, Very Very Special", "Swami is Expelled from School", "Not Just a Teacher, but a Friend", "Homework"],
      }],
      "Physical Science": [{
        bookName: "Physical Science (Class 9)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Matter in Our Surroundings", "Is Matter Around Us Pure?", "Atoms and Molecules", "Structure of the Atom", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound"],
      }],
      "Biological Science": [{
        bookName: "Biological Science (Class 9)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["The Fundamental Unit of Life", "Tissues", "Diversity in Living Organisms", "Why Do We Fall Ill?", "Natural Resources", "Improvement in Food Resources"],
      }],
      "Social Studies": [{
        bookName: "Social Studies (Class 9)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["French Revolution", "Russian Revolution", "Nazism and Rise of Hitler", "Pastoralists in the Modern World", "Forest Society and Colonialism", "India – Size and Location", "Physical Features of India", "Drainage", "Climate", "Natural Vegetation and Wildlife", "Population", "Democracy – What and Why?", "Constitutional Design", "Electoral Politics", "Working of Institutions", "Democratic Rights", "Story of Village Palampur", "People as Resource", "Poverty as a Challenge", "Food Security in India"],
      }],
    },
    "Grade 10": {
      "Mathematics": [{
        bookName: "Mathematics (Class 10)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Real Numbers", "Sets", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Progressions", "Coordinate Geometry", "Similar Triangles", "Tangents and Secants to a Circle", "Mensuration", "Trigonometry", "Applications of Trigonometry", "Probability", "Statistics"],
      }],
      "English": [{
        bookName: "English (Class 10)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Attitude is Altitude", "Every Success Story is Also a Story of Great Failures", "I Will Do It", "The Dear Departed Part 1", "The Dear Departed Part 2", "The Brave Potter", "Once Upon a Time", "What is My Name?", "Rendezvous with Ray", "Maya Bazaar", "A Tribute", "Environment", "Or will the Dreamer Wake?", "A Tale of Three Villages", "My Childhood", "A Plea for India", "Unity in Diversity in India"],
      }],
      "Physical Science": [{
        bookName: "Physical Science (Class 10)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Heat", "Acids, Bases and Salts", "Refraction of Light at Plane Surfaces", "Refraction of Light at Curved Surfaces", "Human Eye – Colourful World", "Structure of Atom", "Classification of Elements – Periodic Table", "Chemical Bonding", "Electric Current", "Electromagnetism", "Metallurgy", "Carbon and Its Compounds"],
      }],
      "Biological Science": [{
        bookName: "Biological Science (Class 10)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["Nutrition", "Respiration", "Transportation", "Excretion", "Control and Coordination", "Reproduction", "Heredity", "Our Environment", "Natural Resources", "How do Organisms Reproduce?"],
      }],
      "Social Studies": [{
        bookName: "Social Studies (Class 10)",
        publisher: "SCERT Andhra Pradesh",
        chapters: ["India: Geographical Features", "Development Concepts", "Production and Employment", "India's Climate", "India's Rivers and Water Resources", "India: People and Settlements", "India: People and Migration", "Transportation and Communication", "Rampur: Village Economy", "Globalisation", "Food Security", "Equity and Sustainable Development", "The World Between Wars 1900-1950 Part-I", "The World Between Wars 1900-1950 Part-II", "National Liberation Movements", "National Movement in India 1885-1919", "National Movement 1919-1947", "Post-War National Movements", "Democracy and Diversity", "Challenges to Democracy"],
      }],
    },
  },
  "Tamil Nadu": {
    "Grade 1": {
      "Mathematics": [{
        bookName: "Mathematics (Std 1)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Shapes", "Numbers 1 to 20", "Addition", "Subtraction", "Numbers 21 to 50", "Measurement", "Time", "Money", "Patterns"],
      }],
      "English": [{
        bookName: "English (Std 1)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["My Family", "My School", "Animals", "Fruits and Vegetables", "Good Habits", "My Body", "Birds", "Colours", "Festivals"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 1)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["My Family", "My Home", "My School", "Animals", "Plants", "Food", "Water", "Transport"],
      }],
    },
    "Grade 2": {
      "Mathematics": [{
        bookName: "Mathematics (Std 2)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Numbers up to 100", "Addition", "Subtraction", "Multiplication Introduction", "Shapes", "Measurement", "Time", "Money", "Data Handling", "Patterns"],
      }],
      "English": [{
        bookName: "English (Std 2)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["My Friends", "At the Park", "In the Classroom", "Stories of Animals", "Rhymes and Poems", "Good Manners", "Seasons", "Festivals of Tamil Nadu"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 2)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["My Family", "Our Food", "Water", "Animals Around Us", "Plants", "My Body", "Clothes", "Transport", "Festivals"],
      }],
    },
    "Grade 3": {
      "Mathematics": [{
        bookName: "Mathematics (Std 3)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Numbers up to 1000", "Addition and Subtraction", "Multiplication", "Division", "Fractions", "Shapes and Patterns", "Measurement", "Time", "Money", "Data Handling"],
      }],
      "English": [{
        bookName: "English (Std 3)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["The Clever Crow", "The Greedy Dog", "Stories of Kindness", "Poems of Nature", "My Country India", "Good Habits", "Our Helpers", "Animals and Birds", "Festivals of India"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 3)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Our Family", "Food and Nutrition", "Water Resources", "Air", "Plants and Animals", "Our Body", "Safety and First Aid", "Transport", "Maps", "Our State – Tamil Nadu"],
      }],
    },
    "Grade 4": {
      "Mathematics": [{
        bookName: "Mathematics (Std 4)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Numbers up to 10,000", "Addition and Subtraction", "Multiplication", "Division", "Fractions", "Decimals", "Geometry – Shapes", "Perimeter and Area", "Measurement", "Time", "Money", "Patterns", "Data Handling"],
      }],
      "English": [{
        bookName: "English (Std 4)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["The Boy and the Wolf", "The Honest Farmer", "Stories of Courage", "My India", "Poems and Rhymes", "Our National Heroes", "Nature and Environment", "Reading and Writing", "Grammar Fun"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 4)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Living Things", "Plants – Parts and Functions", "Animals – Adaptation", "Food and Health", "Water – Uses and Conservation", "Air and Weather", "Rocks and Soil", "Our Body", "Maps and Directions", "Tamil Nadu – Our State", "Transport"],
      }],
    },
    "Grade 5": {
      "Mathematics": [{
        bookName: "Mathematics (Std 5)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Large Numbers", "Addition and Subtraction", "Multiplication and Division", "Fractions", "Decimals", "Percentage", "Geometry – Lines and Angles", "Perimeter and Area", "Volume", "Data Handling", "Patterns", "Time"],
      }],
      "English": [{
        bookName: "English (Std 5)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Adventures of a Child", "Stories of Great People", "Poems of Nature", "Festivals of Tamil Nadu", "Grammar and Composition", "The Clever Judge", "Our Environment", "Reading Comprehension", "Stories of Wisdom"],
      }],
      "Science": [{
        bookName: "Science (Std 5)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Our Earth and Solar System", "Natural Resources", "Plants and Animals", "Human Body – Organs", "Food and Nutrition", "Water Cycle", "Air and Weather", "Simple Machines", "Light and Sound", "Environment Conservation"],
      }],
      "Social Science": [{
        bookName: "Social Science (Std 5)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Our Country India", "History of Tamil Nadu", "Physical Features of India", "Maps", "Our Government", "Transport and Communication", "Resources", "Festivals and Culture", "National Symbols"],
      }],
    },
    "Grade 6": {
      "Mathematics": [{
        bookName: "Mathematics (Std 6)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Numbers", "Introduction to Algebra", "Ratio and Proportion", "Geometry", "Statistics", "Information Processing", "Measurements", "Bill, Profit and Loss", "Fractions", "Integers", "Perimeter and Area", "Symmetry"],
      }],
      "English": [{
        bookName: "English (Std 6)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Sports Stars", "Team Work", "Think to Win", "Trip to Ooty", "From a Railway Carriage", "Gulliver's Travel", "Prose and Poetry Selections", "Grammar and Composition"],
      }],
      "Science": [{
        bookName: "Science (Std 6)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Measurement", "Force and Motion", "Matter Around Us", "The World of Plants", "The World of Animals", "Health and Hygiene", "Computer – An Introduction", "Heat", "Magnetism", "Electricity", "Our Environment"],
      }],
      "Social Science": [{
        bookName: "Social Science (Std 6)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["What is History?", "Human Evolution", "Indus Civilisation", "Ancient Cities of Tamilagam", "The Universe and Solar System", "Land and Oceans", "Understanding Diversity", "Achieving Equality", "Vedic Culture in North India and Megalithic Culture in South India", "Great Thinkers and New Faiths", "From Chiefdoms to Empires", "Resources", "National Symbols", "The Constitution of India", "Economics – An Introduction"],
      }],
    },
    "Grade 7": {
      "Mathematics": [{
        bookName: "Mathematics (Std 7)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Number System", "Measurements", "Algebra", "Direct and Inverse Proportion", "Geometry", "Information Processing", "Percentage and Simple Interest", "Statistics", "Rational Numbers", "Practical Geometry"],
      }],
      "English": [{
        bookName: "English (Std 7)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Eidgah", "The Computer Swallowed Grandma", "On Monday Morning", "The Wind on Haunted Hill", "The Listeners", "The Red-Headed League", "A Prayer to the Teacher", "Your Space", "Taking the Bully by the Horns", "Adventures of Don Quixote", "The Poem of Adventure", "Alice in Wonderland", "The Last Stone Carver", "Wandering Singers", "Naya – The Home of Chitrakaars"],
      }],
      "Science": [{
        bookName: "Science (Std 7)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Measurement", "Force and Motion", "Heat and Temperature", "Matter Around Us", "Atoms and Molecules", "Reproduction and Modification in Plants", "Visual Communication", "Electricity", "Magnetism", "Classification of Plants", "Animal Kingdom", "Health and Hygiene", "Chemistry in Daily Life", "Water"],
      }],
      "Social Science": [{
        bookName: "Social Science (Std 7)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Sources of Medieval India", "Emergence of New Kingdoms in North India", "Emergence of New Kingdoms in South India: Later Cholas and Pandyas", "The Delhi Sultanate", "Interior of the Earth", "Landforms", "Population and Settlement", "Equality", "Political Parties", "Production", "Vijayanagar and Bahmani Kingdoms", "State Government", "Media and Democracy", "New Religious Ideas and Movements", "Art and Architecture of Tamil Nadu"],
      }],
    },
    "Grade 8": {
      "Mathematics": [{
        bookName: "Mathematics (Std 8)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Numbers", "Measurements", "Algebra", "Life Mathematics", "Geometry", "Statistics", "Information Processing"],
      }],
      "English": [{
        bookName: "English (Std 8)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["The Nose-Jewel", "Special Hero", "The Woman on Platform 8", "Hobby Turns into A Successful Career", "My Hobby: Reading", "Jim Corbett, A Hunter Turned Naturalist", "Sir Isaac Newton – The Ingenious Scientist", "Making Life Worth While", "The Three Questions", "My Reminiscence", "A Thing of Beauty", "Crossing the River", "Being Safe", "Fire Work Night", "When Instinct Works", "Friendship"],
      }],
      "Science": [{
        bookName: "Science (Std 8)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Measurement", "Force and Pressure", "Light", "Heat", "Electricity", "Sound", "Magnetism", "Universe and Space Science", "Matter Around Us", "Changes Around Us", "Air", "Atomic Structure", "Water", "Acids and Bases", "Chemistry in Everyday Life", "Microorganisms", "Plant Kingdom", "Organisation of Life", "Movements in Animals", "Reaching the Age of Adolescence", "Crop Production and Management", "Conservation of Plants and Animals"],
      }],
      "Social Science": [{
        bookName: "Social Science (Std 8)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Advent of the Europeans", "From Trade to Territory", "Rural Life and Society", "People's Revolt", "Educational Development in India", "Development of Industries in India", "Urban Changes During the British Period", "Status of Women in India Through the Ages", "Rocks and Soils", "Weather and Climate", "Hydrologic Cycle", "Migration and Urbanisation", "Hazards", "Industries", "Exploring Continents – Africa, Australia and Antarctica", "Map Reading"],
      }],
    },
    "Grade 9": {
      "Mathematics": [{
        bookName: "Mathematics (Std 9)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Set Language", "Real Numbers", "Algebra", "Geometry", "Coordinate Geometry", "Trigonometry", "Mensuration", "Statistics", "Probability"],
      }],
      "English": [{
        bookName: "English (Std 9)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Learning the Game", "The Envious Neighbour", "I can't Climb Trees Anymore", "The Fun They Had", "Old Man River", "On Killing a Tree", "Earthquake", "Seventeen Oranges", "Stopping by Woods on a Snowy Evening", "A Poison Tree", "The Spider and the Fly", "The Cat and the Painkiller", "Water – The Elixir of Life"],
      }],
      "Science": [{
        bookName: "Science (Std 9)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Measurement", "Motion", "Fluids", "Electric Charge and Electric Current", "Magnetism and Electromagnetism", "Light", "Heat", "Sound", "Universe", "Matter Around Us", "Atomic Structure", "Periodic Classification of Elements", "Chemical Bonding", "Acids, Bases and Salts", "Carbon and its Compounds", "Applied Chemistry", "Animal Kingdom", "Organisation of Tissues", "Plant Physiology", "Organ Systems in Animals", "Nutrition and Health", "Reproduction", "Evolution", "Environmental Science"],
      }],
      "Social Science": [{
        bookName: "Social Science (Std 9)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Evolution of Humans and Society – Prehistoric Period", "Ancient Civilisations", "Early Tamil Society and Culture", "Intellectual Awakening", "The Medieval World", "The Middle Ages", "Mapping Skills", "Lithosphere", "Atmosphere", "Hydrosphere", "Biosphere", "Disaster Management", "Understanding Development", "National Income", "Tamil Nadu – Land of Culture"],
      }],
    },
    "Grade 10": {
      "Mathematics": [{
        bookName: "Mathematics (Std 10)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Relations and Functions", "Numbers and Sequences", "Algebra", "Geometry", "Coordinate Geometry", "Trigonometry", "Mensuration", "Statistics and Probability"],
      }],
      "English": [{
        bookName: "English (Std 10)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["His First Flight", "Life", "The Tempest", "The Night the Ghost Got In", "The Grumble Family", "Zigzag", "Empowered Women Navigating The World", "I am Every Woman", "The Story of Mulan", "The Attic", "The Ant and the Cricket", "The Aged Mother", "Tech Bloomers", "The Secret of the Machines", "A Day in 2889 of an American Journalist", "The Last Lesson", "No Men Are Foreign", "The Little Hero of Holland", "The Dying Detective", "The House on Elm Street"],
      }],
      "Science": [{
        bookName: "Science (Std 10)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Laws of Motion", "Optics", "Thermal Physics", "Electricity", "Acoustics", "Nuclear Physics", "Atoms and Molecules", "Periodic Classification of Elements", "Solutions", "Types of Chemical Reactions", "Carbon and its Compounds", "Plant Anatomy and Plant Physiology", "Structural Organization of Animals", "Transportation in Plants and Circulation in Animals", "Nervous System", "Plant and Animal Hormones", "Reproduction in Plants and Animals", "Heredity", "Origin and Evolution of Life", "Breeding and Biotechnology", "Health and Diseases", "Environmental Management"],
      }],
      "Social Science": [{
        bookName: "Social Science (Std 10)",
        publisher: "TN SCERT / Samacheer Kalvi",
        chapters: ["Outbreak of World War I and Its Aftermath", "The World Between Two World Wars", "World War II", "The World After World War II", "Social and Religious Reform Movements in the 19th Century", "Early Revolts Against British Rule in Tamil Nadu", "Anti-Colonial Movements and the Birth of Nationalism", "Nationalism: Gandhian Phase", "Freedom Struggle in Tamil Nadu", "Social Transformation in Tamil Nadu", "India – Location, Relief and Drainage", "Climate and Natural Vegetation of India", "India – Agriculture", "India – Resources and Industries", "India – Population, Transport, Communication and Trade", "Physical Geography of Tamil Nadu", "Human Geography of Tamil Nadu", "Indian Constitution", "Central Government", "State Government", "India's Foreign Policy", "India's International Relations", "Gross Domestic Product and Its Growth", "Government and Taxes", "Globalization and Trade", "Consumer Protection"],
      }],
    },
  },
};

const SUBJECT_ALIASES: Record<string, string[]> = {
  "science": ["general science", "physical science", "biological science", "science and technology"],
  "general science": ["science"],
  "physical science": ["science"],
  "biological science": ["science"],
  "social science": ["social studies", "history", "geography", "civics"],
  "social studies": ["social science", "history", "geography", "civics"],
  "history": ["social science", "social studies"],
  "geography": ["social science", "social studies"],
  "maths": ["mathematics"],
  "math": ["mathematics"],
  "mathematics": ["maths", "math"],
  "evs": ["environmental studies"],
  "environmental studies": ["evs"],
};

export function getStateBoardBooks(
  stateBoard: string,
  className: string,
  subject: string
): StateBoardBookInfo[] {
  const stateData = STATE_BOARD_CHAPTER_DATA[stateBoard];
  if (!stateData) return [];
  const gradeData = stateData[className];
  if (!gradeData) return [];
  const subjectLower = subject.toLowerCase().trim();
  let subjectKey = Object.keys(gradeData).find(
    (k) => k.toLowerCase() === subjectLower
  );
  if (!subjectKey) {
    const aliases = SUBJECT_ALIASES[subjectLower] || [];
    for (const alias of aliases) {
      subjectKey = Object.keys(gradeData).find(
        (k) => k.toLowerCase() === alias
      );
      if (subjectKey) break;
    }
  }
  if (!subjectKey) {
    subjectKey = Object.keys(gradeData).find(
      (k) => k.toLowerCase().includes(subjectLower) || subjectLower.includes(k.toLowerCase())
    );
  }
  if (!subjectKey) {
    const results: StateBoardBookInfo[] = [];
    for (const key of Object.keys(gradeData)) {
      if (key.toLowerCase().includes(subjectLower) || subjectLower.includes(key.toLowerCase())) {
        results.push(...gradeData[key]);
      }
    }
    if (results.length > 0) return results;
    return [];
  }
  return gradeData[subjectKey];
}
