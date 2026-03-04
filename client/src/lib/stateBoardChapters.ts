export interface StateBoardBookInfo {
  bookName: string;
  publisher: string;
  chapters: string[];
}

export const STATE_BOARDS = [
  { value: "Maharashtra", label: "Maharashtra State Board (Balbharati)" },
  { value: "Andhra Pradesh", label: "Andhra Pradesh State Board (SCERT AP)" },
  { value: "Tamil Nadu", label: "Tamil Nadu State Board (TN SCERT)" },
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
        chapters: ["Numbers up to 1,00,000", "Roman Numerals", "Addition and Subtraction", "Multiplication and Division", "Fractions and Decimals", "Factors and Multiples", "Geometry – Angles and Triangles", "Perimeter and Area", "Volume", "Data Handling – Bar Graph", "Symmetry", "Patterns"],
      }],
      "English": [{
        bookName: "My English Book (Std 5)",
        publisher: "Balbharati",
        chapters: ["A Picnic by the River", "The Magic Garden", "The Clever Monkey", "My Grandmother's Stories", "The Kind Prince", "Poems and Compositions", "Great Indians", "Environmental Awareness", "Science Stories", "My Country India", "Comprehension Passages"],
      }],
      "General Science": [{
        bookName: "General Science (Std 5)",
        publisher: "Balbharati",
        chapters: ["Living World – Plants", "Living World – Animals", "Human Body – Organ Systems", "Food and Nutrition", "Substances and Their Properties", "Natural Resources", "Weather and Climate", "Simple Machines", "Our Environment", "Information Technology Basics"],
      }],
    },
    "Grade 6": {
      "Mathematics": [{
        bookName: "Mathematics (Std 6)",
        publisher: "Balbharati",
        chapters: ["Basic Concepts in Geometry", "Angles", "Integers", "Operations on Fractions", "Decimal Fractions", "Ratio and Proportion", "Algebraic Expressions", "Simple Equations", "Perimeter and Area", "Data Handling", "Three Dimensional Shapes", "Symmetry"],
      }],
      "Science": [{
        bookName: "General Science (Std 6)",
        publisher: "Balbharati",
        chapters: ["Natural Resources – Air, Water, Land", "The Living World", "Diversity in Living Things", "Disaster Management", "Substances and Their Properties", "Separation of Substances", "Changes – Physical and Chemical", "Measurement and Motion", "Force and Types of Force", "Simple Machines", "Work and Energy", "Sound", "Light", "Magnets", "Fun with Magnets"],
      }],
      "English": [{
        bookName: "English Balbharati (Std 6)",
        publisher: "Balbharati",
        chapters: ["Who's Who?", "A Kite", "If Things Could Talk", "Around the World", "Be a Good Sport", "Who Has Seen the Wind?", "Saved by a Dolphin", "A Great Indian Cricketer", "Invictus", "Taking Care of the Earth", "Supplementary Stories"],
      }],
      "Social Science": [
        {
          bookName: "History and Civics (Std 6)",
          publisher: "Balbharati",
          chapters: ["The Indian Subcontinent and History", "Sources of History", "The Harappan Civilization", "The Vedic Civilization", "Religious Trends in Ancient India", "Janapadas and Mahajanapadas", "India during the Maurya Period", "States after the Maurya Empire", "Ancient India: Cultural", "Ancient India: Kingdoms of the South"],
        },
        {
          bookName: "Geography (Std 6)",
          publisher: "Balbharati",
          chapters: ["The Earth and the Graticule", "Let Us Use the Globe", "Seasons", "Weather and Climate", "Temperature", "Rainfall", "Natural Regions", "Indian Landforms", "Indian Climate", "Water Resources in India"],
        },
      ],
    },
    "Grade 7": {
      "Mathematics": [{
        bookName: "Mathematics (Std 7)",
        publisher: "Balbharati",
        chapters: ["Geometrical Constructions", "Angles and Pairs of Angles", "Operations on Rational Numbers", "Indices", "Algebraic Expressions", "Simple Equations", "Direct and Inverse Proportion", "Percentage", "Profit and Loss", "Statistics", "Circle", "Perimeter and Area", "Three Dimensional Shapes"],
      }],
      "Science": [{
        bookName: "General Science (Std 7)",
        publisher: "Balbharati",
        chapters: ["The Living World – Adaptations and Classification", "Plants – Structure and Function", "Properties of Natural Resources", "Nutrition in Living Organisms", "Acids, Bases and Salts", "Measurement of Physical Quantities", "Motion, Force and Work", "Static Electricity", "Heat", "Transmission of Sound", "Properties of Light", "Cell Structure and Micro-organisms", "Nutrition and Diet", "Fibres and Fabrics", "Materials We Use"],
      }],
      "English": [{
        bookName: "English Balbharati (Std 7)",
        publisher: "Balbharati",
        chapters: ["A Teenager's Prayer", "From a Railway Carriage", "The Story of My Life", "How the Weatherman Forecasts the Weather", "Tartary", "A Letter to God", "A Hero", "Who Am I?", "Autobiography of a Banyan Tree", "Sea Fever", "Maya Helps a Monkey", "Supplementary Poems"],
      }],
      "Social Science": [
        {
          bookName: "History and Civics (Std 7)",
          publisher: "Balbharati",
          chapters: ["Medieval India", "India – The Delhi Sultanate", "The Mughal Empire", "The Maratha Empire – Shivaji Maharaj", "Administration of Shivaji Maharaj", "Peshwa Period", "The British in India", "Socio-Religious Reforms", "First War of Independence 1857", "Social and Religious Awakening"],
        },
        {
          bookName: "Geography (Std 7)",
          publisher: "Balbharati",
          chapters: ["Landforms", "Weather and Climate", "Natural Vegetation and Wildlife", "Soils", "Agriculture in India", "Industries in India", "Population", "Transportation and Communication", "Maharashtra – Physical Features", "Maharashtra – Climate and Vegetation"],
        },
      ],
    },
    "Grade 8": {
      "Mathematics": [{
        bookName: "Mathematics (Std 8)",
        publisher: "Balbharati",
        chapters: ["Rational and Irrational Numbers", "Parallel Lines and Transversals", "Indices and Cube Root", "Altitudes and Medians of a Triangle", "Expansion Formulae", "Factorisation of Algebraic Expressions", "Variation", "Quadrilateral: Constructions and Types", "Discount and Commission", "Division of Polynomials", "Statistics", "Equations in One Variable", "Congruence of Triangles", "Compound Interest", "Area", "Surface Area and Volume", "Circle – Chord and Arc", "Trigonometry"],
      }],
      "Science": [{
        bookName: "General Science (Std 8)",
        publisher: "Balbharati",
        chapters: ["Living World and Classification", "Health and Diseases", "Force and Pressure", "Current Electricity and Magnetism", "Inside the Atom", "Composition of Matter", "Combustion, Flame and Fuel", "Pollution", "Disaster Management", "Cell Biology and Biotechnology", "Measurement and Effects of Heat", "Sound", "Reflection of Light", "Chemical Change and Chemical Bond", "Man-Made Materials", "Metals and Non-metals", "Introduction to Acid and Base", "Ecosystems", "Life Cycle of Stars"],
      }],
    },
    "Grade 9": {
      "Mathematics": [{
        bookName: "Mathematics Part I (Std 9)",
        publisher: "Balbharati",
        chapters: ["Sets", "Real Numbers", "Polynomials", "Linear Equations in Two Variables", "Ratio and Proportion", "Financial Planning", "Statistics"],
      }],
      "Science": [{
        bookName: "Science and Technology Part I (Std 9)",
        publisher: "Balbharati",
        chapters: ["Laws of Motion", "Work and Energy", "Current Electricity", "Measurement of Matter", "Acids, Bases and Salts", "Classification of Plants", "Energy Flow in an Ecosystem", "Useful and Harmful Microbes", "Environmental Management", "Information Communication Technology"],
      }],
    },
    "Grade 10": {
      "Mathematics": [{
        bookName: "Mathematics Part I (Std 10)",
        publisher: "Balbharati",
        chapters: ["Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progression", "Financial Planning", "Probability", "Statistics"],
      }],
      "Science": [{
        bookName: "Science and Technology Part I (Std 10)",
        publisher: "Balbharati",
        chapters: ["Gravitation", "Periodic Classification of Elements", "Chemical Reactions and Equations", "Effects of Electric Current", "Heat", "Refraction of Light", "Lenses", "Metallurgy", "Carbon Compounds", "Space Missions", "Heredity and Evolution", "Life Processes", "Control and Coordination", "Social Health", "Disaster Management", "Environmental Management"],
      }],
    },
  },

  "Andhra Pradesh": {
    "Grade 1": {
      "Mathematics": [{
        bookName: "Mathematics (Class 1)",
        publisher: "SCERT AP",
        chapters: ["Shapes Around Us", "Numbers 1 to 9", "Addition", "Subtraction", "Numbers 10 to 20", "Measurement – Length", "Time", "Numbers up to 50", "Money", "Data Handling", "Patterns"],
      }],
      "English": [{
        bookName: "My English World (Class 1)",
        publisher: "SCERT AP",
        chapters: ["Greetings", "My Family", "My School", "Animals I Know", "My Food", "Good Habits", "Colours and Shapes", "Parts of Body", "Birds Around Us", "Festivals", "My Town"],
      }],
      "Telugu": [{
        bookName: "Telugu Vaddu (Class 1)",
        publisher: "SCERT AP",
        chapters: ["అమ్మ", "మా ఇల్లు", "మా బడి", "జంతువులు", "పండ్లు-కూరగాయలు", "మా ఊరు", "పక్షులు", "ఋతువులు", "పండుగలు", "మంచి అలవాట్లు"],
      }],
    },
    "Grade 2": {
      "Mathematics": [{
        bookName: "Mathematics (Class 2)",
        publisher: "SCERT AP",
        chapters: ["Numbers up to 100", "Addition", "Subtraction", "Multiplication Introduction", "Shapes and Spatial Understanding", "Measurement – Length and Weight", "Time and Calendar", "Money", "Data Handling", "Patterns and Symmetry"],
      }],
      "English": [{
        bookName: "My English World (Class 2)",
        publisher: "SCERT AP",
        chapters: ["My Best Friend", "In the Park", "The Magic Pot", "At the Market", "Our Helpers", "A Rainy Day", "Healthy Food", "Traffic Rules", "Festivals We Celebrate", "Animal Stories", "Poems for Fun"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Class 2)",
        publisher: "SCERT AP",
        chapters: ["My Family", "Our House", "Our School", "Our Body", "Food and Health", "Water", "Air", "Plants Around Us", "Animals Around Us", "Travel and Safety", "Our Festivals", "Maps and Directions"],
      }],
    },
    "Grade 3": {
      "Mathematics": [{
        bookName: "Mathematics (Class 3)",
        publisher: "SCERT AP",
        chapters: ["Numbers up to 999", "Addition and Subtraction", "Multiplication", "Division", "Fractions", "Shapes and Patterns", "Measurement – Length, Weight, Capacity", "Time", "Money", "Data Handling"],
      }],
      "English": [{
        bookName: "My English World (Class 3)",
        publisher: "SCERT AP",
        chapters: ["The Thirsty Crow", "Good Morning", "The Honest Woodcutter", "Pinocchio", "My Country", "The Fox and the Grapes", "Rain", "The Three Little Pigs", "Friends", "An Indian Scientist"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Class 3)",
        publisher: "SCERT AP",
        chapters: ["Family", "Body and Cleanliness", "Food and Nutrition", "Water – Sources and Uses", "Air", "Shelter", "Clothes", "Plants", "Animals", "Weather", "Transport", "Communication", "Soil"],
      }],
    },
    "Grade 4": {
      "Mathematics": [{
        bookName: "Mathematics (Class 4)",
        publisher: "SCERT AP",
        chapters: ["Large Numbers", "Addition and Subtraction", "Multiplication", "Division", "Fractions and Decimals", "Geometry – Shapes and Angles", "Measurement", "Perimeter and Area", "Time and Calendar", "Money", "Patterns", "Data Handling"],
      }],
      "English": [{
        bookName: "My English World (Class 4)",
        publisher: "SCERT AP",
        chapters: ["Going to School", "A Picnic", "Adventures of a Coin", "The Jungle Book", "Our National Symbols", "The Ugly Duckling", "Festivals of India", "Science and Discoveries", "Poems and Rhymes", "Comprehension Passages"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Class 4)",
        publisher: "SCERT AP",
        chapters: ["Plants – Types and Uses", "Animals – Habitats", "Human Body – Digestive System", "Food Groups", "Water Cycle", "Air – Composition", "Rocks and Minerals", "Maps", "Transport and Communication", "Community Helpers", "Conservation of Resources", "Andhra Pradesh – Our State"],
      }],
    },
    "Grade 5": {
      "Mathematics": [{
        bookName: "Mathematics (Class 5)",
        publisher: "SCERT AP",
        chapters: ["Large Numbers and Place Value", "Factors and Multiples", "Fractions", "Decimals", "Percentage Introduction", "Geometry – Lines, Angles, Triangles", "Perimeter and Area", "Volume and Capacity", "Data Handling – Pictographs and Bar Graphs", "Symmetry", "Patterns", "Problem Solving"],
      }],
      "English": [{
        bookName: "My English World (Class 5)",
        publisher: "SCERT AP",
        chapters: ["Our Beautiful World", "The Train Ride", "Gulliver's Travels", "Great Leaders of India", "Science Around Us", "The Solar System", "My Dream", "Sports and Games", "Poems and Writing", "Grammar and Comprehension"],
      }],
      "General Science": [{
        bookName: "General Science (Class 5)",
        publisher: "SCERT AP",
        chapters: ["Plants and Their Growth", "Animals – Adaptations", "Human Body – Skeletal System", "Food and Health", "Water – Conservation", "Air – Properties", "Soil Types", "Simple Machines", "Energy Sources", "Our Environment"],
      }],
    },
    "Grade 6": {
      "Mathematics": [{
        bookName: "Mathematics (Class 6)",
        publisher: "SCERT AP",
        chapters: ["Knowing Our Numbers", "Whole Numbers", "Playing with Numbers", "Basic Geometrical Ideas", "Understanding Elementary Shapes", "Integers", "Fractions", "Decimals", "Data Handling", "Mensuration", "Algebra", "Ratio and Proportion", "Symmetry", "Practical Geometry"],
      }],
      "Science": [{
        bookName: "General Science (Class 6)",
        publisher: "SCERT AP",
        chapters: ["Food – Where Does It Come From?", "Components of Food", "Fibre to Fabric", "Sorting Materials into Groups", "Separation of Substances", "Changes Around Us", "Getting to Know Plants", "Body Movements", "The Living Organisms and Their Surroundings", "Motion and Measurement of Distances", "Light, Shadows and Reflections", "Electricity and Circuits", "Fun with Magnets", "Water", "Air Around Us", "Garbage In, Garbage Out"],
      }],
      "Social Science": [
        {
          bookName: "History (Class 6)",
          publisher: "SCERT AP",
          chapters: ["What, Where, How and When?", "On the Trail of the Earliest People", "From Gathering to Growing Food", "In the Earliest Cities", "What Books and Burials Tell Us", "Kingdoms, Kings and an Early Republic", "New Questions and Ideas", "Ashoka, The Emperor", "Vital Villages, Thriving Towns", "Traders, Kings and Pilgrims", "New Empires and Kingdoms", "Buildings, Paintings and Books"],
        },
        {
          bookName: "Geography (Class 6)",
          publisher: "SCERT AP",
          chapters: ["The Earth in the Solar System", "Globe – Latitudes and Longitudes", "Motions of the Earth", "Maps", "Major Domains of the Earth", "Major Landforms of the Earth", "Our Country – India", "India – Climate, Vegetation and Wildlife"],
        },
      ],
    },
    "Grade 7": {
      "Mathematics": [{
        bookName: "Mathematics (Class 7)",
        publisher: "SCERT AP",
        chapters: ["Integers", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles", "The Triangle and Its Properties", "Congruence of Triangles", "Comparing Quantities", "Rational Numbers", "Practical Geometry", "Perimeter and Area", "Algebraic Expressions", "Exponents and Powers", "Symmetry", "Visualising Solid Shapes"],
      }],
      "Science": [{
        bookName: "General Science (Class 7)",
        publisher: "SCERT AP",
        chapters: ["Nutrition in Plants", "Nutrition in Animals", "Fibre to Fabric", "Heat", "Acids, Bases and Salts", "Physical and Chemical Changes", "Weather, Climate and Adaptations", "Winds, Storms and Cyclones", "Soil", "Respiration in Organisms", "Transportation in Animals and Plants", "Reproduction in Plants", "Motion and Time", "Electric Current and Its Effects", "Light", "Water: A Precious Resource", "Forests: Our Lifeline", "Wastewater Story"],
      }],
    },
    "Grade 8": {
      "Mathematics": [{
        bookName: "Mathematics (Class 8)",
        publisher: "SCERT AP",
        chapters: ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities", "Visualising Solid Shapes", "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs", "Playing with Numbers"],
      }],
      "Science": [{
        bookName: "General Science (Class 8)",
        publisher: "SCERT AP",
        chapters: ["Crop Production and Management", "Microorganisms", "Synthetic Fibres and Plastics", "Materials: Metals and Non-Metals", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell – Structure and Functions", "Reproduction in Animals", "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound", "Chemical Effects of Electric Current", "Some Natural Phenomena", "Light", "Stars and the Solar System", "Pollution of Air and Water"],
      }],
    },
    "Grade 9": {
      "Mathematics": [{
        bookName: "Mathematics (Class 9)",
        publisher: "SCERT AP",
        chapters: ["Real Numbers", "Polynomials and Factorisation", "The Elements of Geometry", "Lines and Angles", "Co-ordinate Geometry", "Linear Equations in Two Variables", "Triangles", "Quadrilaterals", "Statistics", "Surface Areas and Volumes", "Areas", "Circles", "Geometrical Constructions", "Probability"],
      }],
      "Science": [{
        bookName: "Physical Science (Class 9)",
        publisher: "SCERT AP",
        chapters: ["Matter Around Us", "Is Matter Around Us Pure?", "Atoms and Molecules", "Structure of the Atom", "What Is a Chemical Equation?", "Chemical Reactions – Acids, Bases and Salts", "Motion", "Laws of Motion", "Gravitation", "Work and Energy", "Sound", "Floating Bodies"],
      }],
    },
    "Grade 10": {
      "Mathematics": [{
        bookName: "Mathematics (Class 10)",
        publisher: "SCERT AP",
        chapters: ["Real Numbers", "Sets", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Progressions", "Co-ordinate Geometry", "Similar Triangles", "Tangents and Secants to a Circle", "Mensuration", "Trigonometry", "Applications of Trigonometry", "Probability", "Statistics"],
      }],
      "Science": [{
        bookName: "Physical Science (Class 10)",
        publisher: "SCERT AP",
        chapters: ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and Its Compounds", "Periodic Classification of Elements", "Chemical Bonding", "Reflection of Light", "Refraction of Light", "Human Eye", "Electric Current", "Electromagnetism", "Principles of Metallurgy"],
      }],
    },
  },

  "Tamil Nadu": {
    "Grade 1": {
      "Mathematics": [{
        bookName: "Mathematics (Std 1)",
        publisher: "TN SCERT",
        chapters: ["Shapes Around Us", "Numbers 1 to 9", "Addition", "Subtraction", "Numbers 10 to 20", "Time", "Numbers up to 50", "Measurement", "Money", "Data Handling", "Patterns"],
      }],
      "English": [{
        bookName: "English (Std 1)",
        publisher: "TN SCERT",
        chapters: ["Hello", "My Family", "My School Bag", "Tit for Tat", "The Cap Seller and the Monkeys", "My Body", "Colours", "Animals", "Birds", "Good Habits", "Our Helpers"],
      }],
      "Tamil": [{
        bookName: "Tamil (Std 1)",
        publisher: "TN SCERT",
        chapters: ["அம்மா", "பள்ளி", "விலங்குகள்", "பறவைகள்", "பழங்கள்", "காய்கறிகள்", "மலர்கள்", "உடல் உறுப்புகள்", "நல்ல பழக்கங்கள்", "பண்டிகைகள்"],
      }],
    },
    "Grade 2": {
      "Mathematics": [{
        bookName: "Mathematics (Std 2)",
        publisher: "TN SCERT",
        chapters: ["Numbers 1 to 100", "Addition", "Subtraction", "Multiplication Introduction", "Shapes", "Measurement", "Time", "Money", "Data Handling", "Patterns"],
      }],
      "English": [{
        bookName: "English (Std 2)",
        publisher: "TN SCERT",
        chapters: ["Appa's Garden", "The Fox and the Crane", "Greetings", "Jolly the Giraffe", "Rani's Day Out", "Water", "The Clever Crow", "My Friends", "Traffic Rules", "Poem Collection"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 2)",
        publisher: "TN SCERT",
        chapters: ["My Family", "Our House", "Our School", "Food and Health", "Water – Uses and Sources", "Air", "Plants Around Us", "Animals Around Us", "Our Body", "Transport", "Festivals", "Weather"],
      }],
    },
    "Grade 3": {
      "Mathematics": [{
        bookName: "Mathematics (Std 3)",
        publisher: "TN SCERT",
        chapters: ["Numbers up to 1000", "Addition and Subtraction", "Multiplication", "Division", "Fractions", "Geometry – Shapes", "Measurement – Length, Weight, Capacity", "Time and Calendar", "Money", "Data Handling", "Patterns"],
      }],
      "English": [{
        bookName: "English (Std 3)",
        publisher: "TN SCERT",
        chapters: ["A Naughty Goat", "A Visitor from Far Away", "Seasons", "The Lion and the Mouse", "Teamwork", "The Enormous Turnip", "Rain Drops", "The Three Wishes", "Rivers of India", "Poems and Activities"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 3)",
        publisher: "TN SCERT",
        chapters: ["Our Body – Sense Organs", "Food and Nutrition", "Water – Conservation", "Air Pollution", "Plants – Types", "Animals – Habitats", "Weather and Seasons", "Soil", "Transport and Communication", "Community", "Maps", "Tamil Nadu – Our State"],
      }],
    },
    "Grade 4": {
      "Mathematics": [{
        bookName: "Mathematics (Std 4)",
        publisher: "TN SCERT",
        chapters: ["Numbers Beyond 1000", "Addition and Subtraction", "Multiplication", "Division", "Fractions", "Decimals", "Geometry – Lines and Angles", "Perimeter", "Area", "Patterns", "Measurement", "Data Handling", "Time"],
      }],
      "English": [{
        bookName: "English (Std 4)",
        publisher: "TN SCERT",
        chapters: ["My Robot", "Mowgli Goes to the Village", "Rain, Rain Go Away", "Birbal's Wisdom", "The Enormous Fish", "Treasure Island Adventure", "Friends from Different Lands", "Our Great Leaders", "Science Experiments", "Grammar and Writing"],
      }],
      "EVS": [{
        bookName: "Environmental Studies (Std 4)",
        publisher: "TN SCERT",
        chapters: ["Living Things", "Plants – Photosynthesis", "Animal Kingdom", "Human Body – Digestive System", "Food Groups and Nutrition", "Water Cycle", "Air – Atmosphere", "Rocks and Soil Types", "Simple Machines", "Transport Evolution", "Communication", "Conservation of Nature"],
      }],
    },
    "Grade 5": {
      "Mathematics": [{
        bookName: "Mathematics (Std 5)",
        publisher: "TN SCERT",
        chapters: ["Large Numbers", "Factors and Multiples", "Fractions", "Decimals", "Geometry – Types of Angles", "Triangles", "Perimeter and Area", "Volume", "Data Handling", "Symmetry", "Patterns", "Percentage Introduction"],
      }],
      "English": [{
        bookName: "English (Std 5)",
        publisher: "TN SCERT",
        chapters: ["My Bicycle", "Father's Help", "The Ant and the Cricket", "Adventure in a Forest", "The Sky Is the Limit", "A Scientist Speaks", "Our Universe", "Indian Heritage", "Story Writing", "Comprehension Practice"],
      }],
      "Science": [{
        bookName: "Science (Std 5)",
        publisher: "TN SCERT",
        chapters: ["Plants – Growth and Reproduction", "Animals – Adaptation", "Human Body – Respiratory System", "Food – Preservation", "Water – Purification", "Air – Properties and Uses", "Soil – Erosion and Conservation", "Simple Machines and Force", "Energy – Types and Sources", "Our Environment – Protection"],
      }],
    },
    "Grade 6": {
      "Mathematics": [{
        bookName: "Mathematics (Std 6)",
        publisher: "TN SCERT",
        chapters: ["Numbers", "Introduction to Algebra", "Ratio and Proportion", "Geometry", "Statistics", "Information Processing", "Measurements", "Bill, Profit, Loss", "Life Mathematics"],
      }],
      "Science": [{
        bookName: "Science (Std 6)",
        publisher: "TN SCERT",
        chapters: ["Measurements", "Force and Motion", "Matter Around Us", "The World of Plants", "The World of Animals", "Health and Hygiene", "Computer – An Introduction", "Heat", "Magnetism", "Electricity", "Our Environment"],
      }],
      "Social Science": [
        {
          bookName: "History (Std 6)",
          publisher: "TN SCERT",
          chapters: ["What Is History?", "Human Evolution", "Indus Valley Civilization", "Ancient Cities and Kingdoms", "Buddhism and Jainism", "The Mauryas", "The Guptas", "South Indian Kingdoms – Pallavas and Cholas", "Art and Architecture of Ancient India"],
        },
        {
          bookName: "Geography (Std 6)",
          publisher: "TN SCERT",
          chapters: ["Understanding the Earth", "Land and Oceans", "Atmosphere", "Hydrosphere", "India – Physical Features", "India – Climate", "Tamil Nadu – Our State", "Resources and Their Types"],
        },
      ],
    },
    "Grade 7": {
      "Mathematics": [{
        bookName: "Mathematics (Std 7)",
        publisher: "TN SCERT",
        chapters: ["Number System", "Percentage and Simple Interest", "Algebra", "Geometry", "Statistics", "Information Processing", "Measurements", "Life Mathematics", "Set Language"],
      }],
      "Science": [{
        bookName: "Science (Std 7)",
        publisher: "TN SCERT",
        chapters: ["Measurement", "Force and Motion", "Heat and Temperature", "Matter Around Us", "Atoms and Molecules", "Health and Hygiene", "Visual Communication", "Electricity", "Universe and Space", "Reproduction in Plants", "Nutrition", "Cell Biology"],
      }],
    },
    "Grade 8": {
      "Mathematics": [{
        bookName: "Mathematics (Std 8)",
        publisher: "TN SCERT",
        chapters: ["Numbers", "Measurements", "Algebra", "Geometry", "Statistics", "Information Processing", "Set Language", "Life Mathematics"],
      }],
      "Science": [{
        bookName: "Science (Std 8)",
        publisher: "TN SCERT",
        chapters: ["Measurement", "Forces and Pressure", "Light", "Sound", "Electricity", "Atomic Structure", "Chemical Reactions", "Metals and Non-metals", "Carbon and its Compounds", "Cell Biology", "Plant Biology", "Microorganisms", "Health and Diseases", "Ecosystem"],
      }],
    },
    "Grade 9": {
      "Mathematics": [{
        bookName: "Mathematics (Std 9)",
        publisher: "TN SCERT",
        chapters: ["Set Language", "Real Numbers", "Algebra", "Geometry", "Coordinate Geometry", "Trigonometry", "Mensuration", "Statistics", "Probability"],
      }],
      "Science": [{
        bookName: "Science (Std 9)",
        publisher: "TN SCERT",
        chapters: ["Measurement", "Motion", "Fluids", "Electric Charges and Currents", "Magnetism and Electromagnetism", "Light", "Heat", "Atomic Structure", "Periodic Classification of Elements", "Chemical Bonding", "Solutions", "Cell Biology and Biotechnology", "Plant Anatomy and Plant Physiology", "Organisation of Life", "Diversity of Living Organisms"],
      }],
    },
    "Grade 10": {
      "Mathematics": [{
        bookName: "Mathematics (Std 10)",
        publisher: "TN SCERT",
        chapters: ["Relations and Functions", "Numbers and Sequences", "Algebra", "Geometry", "Coordinate Geometry", "Trigonometry", "Mensuration", "Statistics and Probability"],
      }],
      "Science": [{
        bookName: "Science (Std 10)",
        publisher: "TN SCERT",
        chapters: ["Laws of Motion", "Optics", "Thermal Physics", "Electricity", "Acoustics", "Nuclear Physics", "Atoms and Molecules", "Periodic Classification of Elements", "Chemical Bonding", "Solutions", "Types of Chemical Reactions", "Carbon and its Compounds", "Plant Anatomy and Plant Physiology", "Structural Organisation of Animals", "Nervous System", "Plant and Animal Hormones", "Reproduction in Plants and Animals", "Heredity", "Evolution", "Environmental Management"],
      }],
    },
  },
};

export function getStateBoardBooks(stateBoardName: string, className: string, subject: string): StateBoardBookInfo[] {
  const stateData = STATE_BOARD_CHAPTER_DATA[stateBoardName];
  if (!stateData) return [];
  const gradeData = stateData[className];
  if (!gradeData) return [];

  const directMatch = gradeData[subject];
  if (directMatch) return directMatch;

  const subjectLower = subject.toLowerCase();
  for (const [key, books] of Object.entries(gradeData)) {
    if (subjectLower.includes(key.toLowerCase()) || key.toLowerCase().includes(subjectLower)) return books;
  }

  if (subjectLower.includes("math")) return gradeData["Mathematics"] || [];
  if (subjectLower.includes("sci") || subjectLower.includes("physics") || subjectLower.includes("chemistry") || subjectLower.includes("biology")) return gradeData["Science"] || gradeData["General Science"] || [];
  if (subjectLower.includes("eng")) return gradeData["English"] || [];
  if (subjectLower.includes("hindi")) return gradeData["Hindi"] || [];
  if (subjectLower.includes("marathi")) return gradeData["Marathi"] || [];
  if (subjectLower.includes("telugu")) return gradeData["Telugu"] || [];
  if (subjectLower.includes("tamil")) return gradeData["Tamil"] || [];
  if (subjectLower.includes("social") || subjectLower.includes("history") || subjectLower.includes("geography") || subjectLower.includes("civics")) return gradeData["Social Science"] || [];
  if (subjectLower.includes("evs") || subjectLower.includes("environmental")) return gradeData["EVS"] || [];

  return [];
}

export function getStateBoardChapters(stateBoardName: string, className: string, subject: string, bookName: string): string[] {
  const books = getStateBoardBooks(stateBoardName, className, subject);
  const book = books.find(b => b.bookName === bookName);
  return book ? book.chapters : [];
}
