export const NIGERIAN_STATES = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT - Abuja",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara"
];

// Map of State -> Universities (Exhaustive list of Federal, State, and Private)
export const UNIVERSITIES_BY_STATE: Record<string, string[]> = {
    "Abia": [
        "Michael Okpara University of Agriculture, Umudike (Federal)",
        "Abia State University, Uturu (State)",
        "Clifford University, Owerrinta (Private)",
        "Gregory University, Uturu (Private)",
        "Rhema University, Aba (Private)",
        "Spiritan University, Nneochi (Private)",
        "Lux Mundi University, Umuahia (Private)"
    ],
    "Adamawa": [
        "Modibbo Adama University, Yola (Federal)",
        "Adamawa State University, Mubi (State)",
        "American University of Nigeria, Yola (Private)"
    ],
    "Akwa Ibom": [
        "University of Uyo (Federal)",
        "Akwa Ibom State University, Ikot Akpaden (State)",
        "Obong University, Obong Ntak (Private)",
        "Ritman University, Ikot Ekpene (Private)",
        "Topfaith University, Mkpatak (Private)"
    ],
    "Anambra": [
        "Nnamdi Azikiwe University, Awka (Federal)",
        "Chukwuemeka Odumegwu Ojukwu University, Uli (State)",
        "Anambra State University of Science and Technology, Igbariam (State)",
        "Legacy University, Okija (Private)",
        "Madonna University, Okija (Private)",
        "Paul University, Awka (Private)",
        "Tansian University, Umunya (Private)",
        "Eastern Palm University, Ogboko (Private)"
    ],
    "Bauchi": [
        "Abubakar Tafawa Balewa University, Bauchi (Federal)",
        "Bauchi State University, Gadau (State)",
        "Al-Muhibbah Open University (Private)"
    ],
    "Bayelsa": [
        "Federal University, Otuoke (Federal)",
        "Niger Delta University, Wilberforce Island (State)",
        "University of Africa, Toru-Orua (State)",
        "Bayelsa Medical University (State)",
        "Hensard University, Toru-Orua (Private)"
    ],
    "Benue": [
        "Federal University of Agriculture, Makurdi (Federal)",
        "Benue State University, Makurdi (State)",
        "University of Mkar, Mkar (Private)"
    ],
    "Borno": [
        "University of Maiduguri (Federal)",
        "Borno State University, Maiduguri (State)",
        "Nigerian Army University, Biu (Federal)"
    ],
    "Cross River": [
        "University of Calabar (Federal)",
        "University of Cross River State (UNICROSS) (State)",
        "Arthur Jarvis University, Akpabuyo (Private)"
    ],
    "Delta": [
        "Federal University of Petroleum Resources, Effurun (Federal)",
        "Delta State University, Abraka (State)",
        "University of Delta, Agbor (State)",
        "Delta State University of Science and Technology, Ozoro (State)",
        "Dennis Osadebay University, Asaba (State)",
        "Admiralty University of Nigeria, Ibusa (Federal/Private Partnership)",
        "Edwin Clark University, Kiagbodo (Private)",
        "Michael and Cecilia Ibru University (Private)",
        "Novena University, Ogume (Private)",
        "Western Delta University, Oghara (Private)"
    ],
    "Ebonyi": [
        "Alex Ekwueme Federal University, Ndufu-Alike (Federal)",
        "Ebonyi State University, Abakaliki (State)",
        "David Umahi Federal University of Health Sciences, Uburu (Federal)",
        "Evangel University, Akaeze (Private)"
    ],
    "Edo": [
        "University of Benin (UNIBEN) (Federal)",
        "Ambrose Alli University, Ekpoma (State)",
        "Edo State University, Uzairue (State)",
        "Benson Idahosa University, Benin City (Private)",
        "Igbinedion University, Okada (Private)",
        "Samuel Adegboyega University, Ogwa (Private)",
        "Wellspring University, Benin City (Private)",
        "Mudiame University, Irrua (Private)",
        "West Midlands University, Benin City (Private)"
    ],
    "Ekiti": [
        "Federal University, Oye-Ekiti (Federal)",
        "Ekiti State University, Ado Ekiti (State)",
        "Afe Babalola University, Ado-Ekiti (Private)",
        "Bamidele Olumilua University of Education, Science and Technology (State)",
        "Hillside University of Science and Technology, Okemesi (Private)"
    ],
    "Enugu": [
        "University of Nigeria, Nsukka (Federal)",
        "Enugu State University of Science and Technology (State)",
        "Caritas University, Amorji-Nike (Private)",
        "Coal City University, Enugu (Private)",
        "Godfrey Okoye University, Ugwuomu-Nike (Private)",
        "Renaissance University, Ugbawka (Private)",
        "Maduka University, Ekwulumili (Private)"
    ],
    "FCT - Abuja": [
        "African Aviation and Aerospace University (AAAU)",
        "Al-Muhibbah Open University",
        "Amaj University",
        "Baze University",
        "Bingham University",
        "Canadian University of Nigeria",
        "Cosmopolitan University",
        "Eranova University",
        "European University of Nigeria",
        "Miva Open University",
        "National Open University of Nigeria (NOUN)",
        "National University of Science and Technology (NAUST)",
        "Nile University of Nigeria",
        "Philomath University",
        "Prime University",
        "University of Abuja (Yakubu Gowon University)",
        "Veritas University"
    ],
    "Gombe": [
        "Federal University, Kashere (Federal)",
        "Gombe State University, Gombe (State)",
        "Pen Resource University, Gombe (Private)"
    ],
    "Imo": [
        "Federal University of Technology, Owerri (Federal)",
        "Imo State University, Owerri (State)",
        "University of Agriculture and Environmental Sciences, Umuagwo (State)",
        "Kingsley Ozumba Mbadiwe University, Ideato (State)",
        "Claretian University of Nigeria, Nekede (Private)",
        "Hezekiah University, Umudi (Private)",
        "Maranatha University, Mgbidi (Private)"
    ],
    "Jigawa": [
        "Federal University, Dutse (Federal)",
        "Sule Lamido University, Kafin Hausa (State)",
        "Khadija University, Majia (Private)"
    ],
    "Kaduna": [
        "Ahmadu Bello University, Zaria (Federal)",
        "Kaduna State University, Kaduna (State)",
        "Air Force Institute of Technology, Kaduna (Federal)",
        "Nigerian Defence Academy, Kaduna (Federal)",
        "Greenfield University, Kaduna (Private)",
        "Nok University, Kachia (Private)"
    ],
    "Kano": [
        "Bayero University, Kano (Federal)",
        "Kano University of Science and Technology, Wudil (State)",
        "Yusuf Maitama Sule University, Kano (State)",
        "Al-Istiqama University, Sumaila (Private)",
        "Capital City University, Kano (Private)",
        "Maryam Abacha American University of Nigeria, Kano (Private)",
        "Skyline University Nigeria, Kano (Private)",
        "Baba-Ahmed University, Kano (Private)"
    ],
    "Katsina": [
        "Federal University, Dutsin-Ma (Federal)",
        "Umaru Musa Yar'adua University, Katsina (State)",
        "Al-Qalam University, Katsina (Private)"
    ],
    "Kebbi": [
        "Federal University, Birnin Kebbi (Federal)",
        "Kebbi State University of Science and Technology, Aliero (State)",
        "Rayhaan University, Birnin Kebbi (Private)"
    ],
    "Kogi": [
        "Federal University, Lokoja (Federal)",
        "Kogi State University, Anyigba (State)",
        "Confluence University of Science and Technology, Osara (State)",
        "Salem University, Lokoja (Private)"
    ],
    "Kwara": [
        "University of Ilorin (Federal)",
        "Kwara State University, Malete (State)",
        "Al-Hikmah University, Ilorin (Private)",
        "Landmark University, Omu-Aran (Private)",
        "Summit University, Offa (Private)",
        "Thomas Adewumi University, Oko (Private)",
        "Ahman Pategi University, Patigi (Private)"
    ],
    "Lagos": [
        "University of Lagos (Federal)",
        "Lagos State University, Ojo (State)",
        "Lagos State University of Education (State)",
        "Lagos State University of Science and Technology (State)",
        "Anchor University, Ayobo (Private)",
        "Augustine University, Ilara (Private)",
        "Caleb University, Imota (Private)",
        "Lagos Business School / Pan-Atlantic University (Private)",
        "Eko University of Medicine and Health Sciences (Private)",
        "James Hope University, Lekki (Private)",
        "Trinity University, Yaba (Private)"
    ],
    "Nasarawa": [
        "Federal University, Lafia (Federal)",
        "Nasarawa State University, Keffi (State)",
        "Bingham University, Karu (Private)",
        "Ave Maria University, Piyanko (Private)",
        "Mewar International University, Masaka (Private)"
    ],
    "Niger": [
        "Federal University of Technology, Minna (Federal)",
        "Ibrahim Badamasi Babangida University, Lapai (State)",
        "Newgate University, Minna (Private)",
        "Edusoko University, Bida (Private)"
    ],
    "Ogun": [
        "Federal University of Agriculture, Abeokuta (Federal)",
        "Olabisi Onabanjo University, Ago-Iwoye (State)",
        "Tai Solarin University of Education, Ijebu-Ode (State)",
        "Babcock University, Ilishan-Remo (Private)",
        "Bells University of Technology, Ota (Private)",
        "Chrisland University, Abeokuta (Private)",
        "Christopher University, Mowe (Private)",
        "Covenant University, Ota (Private)",
        "Crawford University, Igbesa (Private)",
        "McPherson University, Seriki Sotayo (Private)",
        "Mountain Top University, Ibafo (Private)",
        "Southwestern University, Okun-Owa (Private)"
    ],
    "Ondo": [
        "Federal University of Technology, Akure (Federal)",
        "Adekunle Ajasin University, Akungba-Akoko (State)",
        "Ondo State University of Science and Technology, Okitipupa (State)",
        "University of Medical Sciences, Ondo (State)",
        "Achievers University, Owo (Private)",
        "Elizade University, Ilara-Mokin (Private)",
        "Wesley University of Science and Technology, Ondo (Private)"
    ],
    "Osun": [
        "Obafemi Awolowo University, Ile-Ife (Federal)",
        "Osun State University, Osogbo (State)",
        "Adeleke University, Ede (Private)",
        "Bowen University, Iwo (Private)",
        "Fountain University, Osogbo (Private)",
        "Joseph Ayo Babalola University, Ikeji-Arakeji (Private)",
        "Kings University, Ode-Omu (Private)",
        "Oduduwa University, Ipetumodu (Private)",
        "Redeemer's University, Ede (Private)",
        "Westland University, Iwo (Private)"
    ],
    "Oyo": [
        "University of Ibadan (Federal)",
        "Ladoke Akintola University of Technology, Ogbomoso (State)",
        "First Technical University, Ibadan (State)",
        "Ajayi Crowther University, Oyo (Private)",
        "Dominican University, Ibadan (Private)",
        "Kola Daisi University, Ibadan (Private)",
        "Lead City University, Ibadan (Private)",
        "Precious Cornerstone University, Ibadan (Private)",
        "Atiba University, Oyo (Private)"
    ],
    "Plateau": [
        "University of Jos (Federal)",
        "Plateau State University, Bokkos (State)",
        "Karl Kumm University, Vom (Private)",
        "ANAN University, Kwall (Private)"
    ],
    "Rivers": [
        "University of Port Harcourt (Federal)",
        "Rivers State University (State)",
        "Ignatius Ajuru University of Education (State)",
        "Pamo University of Medical Sciences, Port Harcourt (Private)",
        "Madonna University, Elele (Private)",
        "Wigwe University, Isiokpo (Private)"
    ],
    "Sokoto": [
        "Usmanu Danfodiyo University, Sokoto (Federal)",
        "Sokoto State University (State)",
        "Northwest University, Sokoto (Private)"
    ],
    "Taraba": [
        "Federal University, Wukari (Federal)",
        "Taraba State University, Jalingo (State)",
        "Kwararafa University, Wukari (Private)"
    ],
    "Yobe": [
        "Federal University, Gashua (Federal)",
        "Yobe State University, Damaturu (State)"
    ],
    "Zamfara": [
        "Federal University, Gusau (Federal)",
        "Zamfara State University, Talata Mafara (State)"
    ]
};

// Flattened list for fallback
export const NIGERIAN_UNIVERSITIES = Object.values(UNIVERSITIES_BY_STATE).flat().sort();
