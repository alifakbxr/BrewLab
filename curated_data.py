"""
Curated historical coffee recipes and world bean origins catalog.
Features World Barista & Brewers Cup Champions from 2000 to modern era.
"""

CHAMPION_RECIPES = [
    {
        "id": "champ-2000-nielsen",
        "barista": "Robert Thoresen",
        "achievement": "World Barista Champion 2000 (Monte Carlo, Inaugural)",
        "year": 2000,
        "title": "Nordic Light Roast Espresso Origin",
        "method": "Espresso",
        "bean_name": "Kenya Nyeri Light Roast",
        "dose_grams": 18.0,
        "water_grams": 36.0,
        "ratio": "1:2.0",
        "water_temp_c": 93.0,
        "grind_size": "Fine",
        "brew_time_target": "27s",
        "flavor_profile_target": "Blackcurrant, bright phosphoric acidity, clean sugar cane sweetness",
        "technique_notes": "First WBC winner who pioneered the clean, terroir-driven Nordic roasting style.",
        "pro_tip": "Flush grouphead thoroughly and extract at steady 9 bars."
    },
    {
        "id": "champ-2007-hoffmann",
        "barista": "James Hoffmann",
        "achievement": "World Barista Champion 2007 (Tokyo)",
        "year": 2007,
        "title": "The Ultimate V60 Technique",
        "method": "V60",
        "bean_name": "Ethiopia Washed Yirgacheffe",
        "dose_grams": 15.0,
        "water_grams": 250.0,
        "ratio": "1:16.7",
        "water_temp_c": 98.0,
        "grind_size": "Medium-Fine",
        "brew_time_target": "3m 30s",
        "flavor_profile_target": "Jasmine, bergamot tea, peach sweetness, silky mouthfeel",
        "technique_notes": "Single steady pour after bloom with gentle stir to avoid channeling.",
        "pro_tip": "Swirl gently during bloom and after the final pour to flatten the coffee bed."
    },
    {
        "id": "champ-2012-perry",
        "barista": "Matt Perger",
        "achievement": "World Brewers Cup Champion 2012 (Vienna)",
        "year": 2012,
        "title": "High-Extraction V60 Stir Method",
        "method": "V60",
        "bean_name": "Colombia Geisha Natural",
        "dose_grams": 12.0,
        "water_grams": 200.0,
        "ratio": "1:16.7",
        "water_temp_c": 96.0,
        "grind_size": "Medium-Coarse",
        "brew_time_target": "2m 20s",
        "flavor_profile_target": "Tropical fruit, mango, apricot, vibrant citric sparkle",
        "technique_notes": "Active spoon agitation during bloom to maximize extraction evenness.",
        "pro_tip": "Sift fines if possible, or tap the dripper firmly on the decanter after pouring."
    },
    {
        "id": "champ-2016-kasuya",
        "barista": "Tetsu Kasuya",
        "achievement": "World Brewers Cup Champion 2016 (Dublin)",
        "year": 2016,
        "title": "The 4:6 Method",
        "method": "V60",
        "bean_name": "Panama Geisha Washed",
        "dose_grams": 20.0,
        "water_grams": 300.0,
        "ratio": "1:15.0",
        "water_temp_c": 88.0,
        "grind_size": "Coarse",
        "brew_time_target": "3m 30s",
        "flavor_profile_target": "White floral, ripe papaya, sparkling clean honey finish",
        "technique_notes": "First 40% of water (120g in 2 pours) adjusts acidity/sweetness; remaining 60% (180g in 3 pours) adjusts body.",
        "pro_tip": "Wait for each 60g pour to drain completely before starting the next pour."
    },
    {
        "id": "champ-2018-fukahori",
        "barista": "Emi Fukahori",
        "achievement": "World Brewers Cup Champion 2018 (Belo Horizonte)",
        "year": 2018,
        "title": "Cold Bloom Controlled Extraction",
        "method": "V60",
        "bean_name": "Laurina Natural (Low Caffeine)",
        "dose_grams": 16.0,
        "water_grams": 240.0,
        "ratio": "1:15.0",
        "water_temp_c": 90.0,
        "grind_size": "Medium",
        "brew_time_target": "2m 45s",
        "flavor_profile_target": "Candied orange, dried figs, smooth velvety finish",
        "technique_notes": "Room-temp water bloom to preserve delicate aromatics, followed by hot pulses.",
        "pro_tip": "Bloom with 40g water at 50°C for 45s, then pour 92°C water for the remaining 200g."
    },
    {
        "id": "champ-2021-winton",
        "barista": "Matt Winton",
        "achievement": "World Brewers Cup Champion 2021 (Milan)",
        "year": 2021,
        "title": "Catucai & Eugenioides Blend Precision",
        "method": "Origami / Kalita",
        "bean_name": "Coffea Eugenioides & Catucai",
        "dose_grams": 16.0,
        "water_grams": 250.0,
        "ratio": "1:15.6",
        "water_temp_c": 93.0,
        "grind_size": "Medium-Fine",
        "brew_time_target": "2m 50s",
        "flavor_profile_target": "Sweet marshmallow, papaya, guava, syrupy honey body",
        "technique_notes": "5 equal pours of 50g with flat-bottom filter to maximize sweet solubles.",
        "pro_tip": "Use a center spiral pour with very low agitation to avoid astringency."
    },
    {
        "id": "champ-2024-influencer",
        "barista": "Lance Hedrick",
        "achievement": "Specialty Coffee Educator & World Latte Art Finalist",
        "year": 2024,
        "title": "Low Agitation Sweetness Maximizer",
        "method": "V60 / Cafec",
        "bean_name": "Kenya SL28 Washed",
        "dose_grams": 15.0,
        "water_grams": 250.0,
        "ratio": "1:16.7",
        "water_temp_c": 94.0,
        "grind_size": "Medium",
        "brew_time_target": "2m 30s",
        "flavor_profile_target": "Pink grapefruit, brown sugar, red currant, sparkling acidity",
        "technique_notes": "Bloom with 50g + swirl. One continuous center pour at 5-6g/sec up to 250g with near-zero agitation.",
        "pro_tip": "Pour from as low as possible without touching the coffee bed."
    }
]

CURATED_BEANS = [
    {
        "name": "Ethiopia Yirgacheffe Washed",
        "origin": "Gedeo Zone, Ethiopia",
        "roaster": "Origin Specialty Roasters",
        "roast_level": "Light",
        "process": "Washed",
        "flavor_notes": ["Jasmine", "Bergamot", "Lemon Zest", "Black Tea"],
        "stock_grams": 200.0,
        "is_favorite": True
    },
    {
        "name": "Aceh Gayo Wine Process",
        "origin": "Takengon, Aceh, Indonesia",
        "roaster": "Sumatra Artisan Craft",
        "roast_level": "Medium-Light",
        "process": "Anaerobic Natural",
        "flavor_notes": ["Red Wine", "Dark Cherry", "Brown Sugar", "Ripe Plum"],
        "stock_grams": 180.0,
        "is_favorite": True
    },
    {
        "name": "Colombia Pink Bourbon",
        "origin": "Huila, Colombia",
        "roaster": "Andes Micro-lot Roastery",
        "roast_level": "Light",
        "process": "Washed",
        "flavor_notes": ["Pink Grapefruit", "White Peach", "Honey", "Floral"],
        "stock_grams": 150.0,
        "is_favorite": False
    },
    {
        "name": "Kenya Nyeri Hill AA",
        "origin": "Nyeri, Kenya",
        "roaster": "Equator Specialty Coffee",
        "roast_level": "Medium-Light",
        "process": "Washed",
        "flavor_notes": ["Blackcurrant", "Tomato Leaf", "Phosphoric Acidity", "Cane Sugar"],
        "stock_grams": 40.0,  # Low stock demo
        "is_favorite": True
    },
    {
        "name": "Panama Boquete Geisha",
        "origin": "Chiriquí, Panama",
        "roaster": "Hacienda Private Selection",
        "roast_level": "Light",
        "process": "Washed",
        "flavor_notes": ["Orange Blossom", "Jasmine", "Apricot", "Earl Grey"],
        "stock_grams": 25.0,  # Low stock demo (< 30g)
        "is_favorite": True
    }
]
