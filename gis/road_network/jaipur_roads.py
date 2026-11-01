"""
Jaipur Road Network & Geospatial Infrastructure Dataset
Pilot City: Jaipur, Rajasthan, India
Geographical Bounding Box: [26.80 N, 75.70 E] to [27.02 N, 75.90 E]

Contains illustrative pilot road corridors and hand-entered example attributes for
software demonstration. Coordinates and hydrological attributes have not been
independently verified against authoritative municipal, survey, or incident records.
Do not treat drainage status, capacity, elevation, slope, or incident counts as
verified operational data until each field is sourced and validated.
"""

from typing import List, Dict, Any

JAIPUR_METADATA = {
    "city": "Jaipur",
    "state": "Rajasthan",
    "country": "India",
    "center": [26.9124, 75.7873],
    "default_zoom": 13,
    "bounding_box": {
        "min_lat": 26.8000,
        "max_lat": 27.0200,
        "min_lon": 75.7000,
        "max_lon": 75.9000,
    },
    "drainage_basins": [
        "Dravyavati River Basin (Amanishah Nallah)",
        "Nahargarh Hill Runoff Basin",
        "Jal Mahal Basin",
        "Sanganer Catchment"
    ],
    "data_readiness": "Illustrative pilot dataset; road and hydrological attributes require field/source verification"
}

# 24 core arterial road segments across Jaipur
JAIPUR_ROAD_SEGMENTS: List[Dict[str, Any]] = [
    {
        "segment_id": "JPR-RD-001",
        "name": "Sodala Underpass & Elevated Corridor",
        "road_type": "primary",
        "coordinates": [
            [26.9015, 75.7725],
            [26.9042, 75.7780],
            [26.9068, 75.7835]
        ],
        "length_m": 1250,
        "elevation_m": 388.2,
        "slope_deg": 4.8,
        "distance_to_drain_m": 120,
        "drainage_status": "partially_blocked",
        "drainage_capacity_m3s": 14.5,
        "basin_id": "Dravyavati River Basin",
        "underpass": True,
        "historical_incidents_count": 14,
        "speed_limit_kmh": 50,
        "critical_infrastructure_nearby": "Sodala Metro Station, Trauma Centre",
        "soil_runoff_coeff": 0.88,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-002",
        "name": "Tonk Road (Gopalpura Flyover to Dravyavati Bridge)",
        "road_type": "primary",
        "coordinates": [
            [26.8650, 75.7950],
            [26.8580, 75.7980],
            [26.8480, 75.8020]
        ],
        "length_m": 2100,
        "elevation_m": 381.5,
        "slope_deg": 1.2,
        "distance_to_drain_m": 45,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 22.0,
        "basin_id": "Dravyavati River Basin",
        "underpass": False,
        "historical_incidents_count": 9,
        "speed_limit_kmh": 60,
        "critical_infrastructure_nearby": "Dravyavati River Check Dam",
        "soil_runoff_coeff": 0.82,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-003",
        "name": "JLN Marg (World Trade Park & Malviya Underpass)",
        "road_type": "primary",
        "coordinates": [
            [26.8530, 75.8050],
            [26.8620, 75.8090],
            [26.8720, 75.8130]
        ],
        "length_m": 2300,
        "elevation_m": 395.0,
        "slope_deg": 2.1,
        "distance_to_drain_m": 280,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 18.0,
        "basin_id": "Malviya Catchment",
        "underpass": True,
        "historical_incidents_count": 7,
        "speed_limit_kmh": 60,
        "critical_infrastructure_nearby": "Fortis Hospital, MNIT Jaipur",
        "soil_runoff_coeff": 0.85,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-004",
        "name": "Amer Road (Jal Mahal Promenade & Submerged Culvert)",
        "road_type": "primary",
        "coordinates": [
            [26.9530, 75.8360],
            [26.9620, 75.8420],
            [26.9710, 75.8490]
        ],
        "length_m": 2400,
        "elevation_m": 390.5,
        "slope_deg": 3.9,
        "distance_to_drain_m": 30,
        "drainage_status": "poor",
        "drainage_capacity_m3s": 11.2,
        "basin_id": "Jal Mahal Basin",
        "underpass": False,
        "historical_incidents_count": 16,
        "speed_limit_kmh": 50,
        "critical_infrastructure_nearby": "Jal Mahal Heritage Area, State Highway 11",
        "soil_runoff_coeff": 0.91,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-005",
        "name": "Sikar Road (Dadi Ka Phatak & Ambabari Link)",
        "road_type": "primary",
        "coordinates": [
            [26.9480, 75.7680],
            [26.9590, 75.7640],
            [26.9720, 75.7590]
        ],
        "length_m": 2800,
        "elevation_m": 391.8,
        "slope_deg": 1.4,
        "distance_to_drain_m": 90,
        "drainage_status": "poor",
        "drainage_capacity_m3s": 12.0,
        "basin_id": "North Jaipur Drainage Channel",
        "underpass": True,
        "historical_incidents_count": 18,
        "speed_limit_kmh": 50,
        "critical_infrastructure_nearby": "Railway Crossing 24, Sikar Bypass Junction",
        "soil_runoff_coeff": 0.89,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-006",
        "name": "MI Road (Panch Batti to Ajmeri Gate)",
        "road_type": "secondary",
        "coordinates": [
            [26.9165, 75.8080],
            [26.9185, 75.8150],
            [26.9200, 75.8210]
        ],
        "length_m": 1500,
        "elevation_m": 432.0,
        "slope_deg": 2.8,
        "distance_to_drain_m": 420,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 15.0,
        "basin_id": "Walled City Basin",
        "underpass": False,
        "historical_incidents_count": 4,
        "speed_limit_kmh": 40,
        "critical_infrastructure_nearby": "SMS Hospital, Commercial Corridor",
        "soil_runoff_coeff": 0.92,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-007",
        "name": "Badi Chaupar & Johari Bazaar (Walled City Low Point)",
        "road_type": "tertiary",
        "coordinates": [
            [26.9238, 75.8265],
            [26.9215, 75.8270],
            [26.9180, 75.8275]
        ],
        "length_m": 850,
        "elevation_m": 434.5,
        "slope_deg": 1.1,
        "distance_to_drain_m": 600,
        "drainage_status": "poor",
        "drainage_capacity_m3s": 8.0,
        "basin_id": "Walled City Basin",
        "underpass": False,
        "historical_incidents_count": 11,
        "speed_limit_kmh": 30,
        "critical_infrastructure_nearby": "Badi Chaupar Metro Station, Hawa Mahal",
        "soil_runoff_coeff": 0.95,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-008",
        "name": "Ajmer Road (Purani Chungi to Sodala Flyover Link)",
        "road_type": "primary",
        "coordinates": [
            [26.8920, 75.7480],
            [26.8970, 75.7590],
            [26.9015, 75.7725]
        ],
        "length_m": 2600,
        "elevation_m": 398.0,
        "slope_deg": 2.2,
        "distance_to_drain_m": 180,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 16.0,
        "basin_id": "Dravyavati River Basin",
        "underpass": False,
        "historical_incidents_count": 5,
        "speed_limit_kmh": 60,
        "critical_infrastructure_nearby": "Purani Chungi Junction",
        "soil_runoff_coeff": 0.80,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-009",
        "name": "Mansarovar Shipra Path (Near Dravyavati Outfall)",
        "road_type": "secondary",
        "coordinates": [
            [26.8520, 75.7620],
            [26.8480, 75.7690],
            [26.8440, 75.7780]
        ],
        "length_m": 1900,
        "elevation_m": 379.2,
        "slope_deg": 0.9,
        "distance_to_drain_m": 35,
        "drainage_status": "partially_blocked",
        "drainage_capacity_m3s": 13.0,
        "basin_id": "Dravyavati River Basin",
        "underpass": False,
        "historical_incidents_count": 13,
        "speed_limit_kmh": 40,
        "critical_infrastructure_nearby": "Mansarovar Metro Terminal, Dravyavati Walkway",
        "soil_runoff_coeff": 0.84,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-010",
        "name": "Civil Lines / Hawa Sadak (Government Secretariat Link)",
        "road_type": "secondary",
        "coordinates": [
            [26.9020, 75.7890],
            [26.9080, 75.7920],
            [26.9140, 75.7960]
        ],
        "length_m": 1650,
        "elevation_m": 418.0,
        "slope_deg": 1.8,
        "distance_to_drain_m": 350,
        "drainage_status": "good",
        "drainage_capacity_m3s": 20.0,
        "basin_id": "Central Jaipur Catchment",
        "underpass": False,
        "historical_incidents_count": 2,
        "speed_limit_kmh": 45,
        "critical_infrastructure_nearby": "Civil Lines Metro Station, Secretariat",
        "soil_runoff_coeff": 0.75,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-011",
        "name": "Gopalpura Bypass (Triveni Nagar Underpass & Drain)",
        "road_type": "primary",
        "coordinates": [
            [26.8610, 75.7750],
            [26.8625, 75.7860],
            [26.8640, 75.7950]
        ],
        "length_m": 2200,
        "elevation_m": 382.4,
        "slope_deg": 1.6,
        "distance_to_drain_m": 65,
        "drainage_status": "poor",
        "drainage_capacity_m3s": 10.5,
        "basin_id": "Dravyavati River Basin",
        "underpass": True,
        "historical_incidents_count": 15,
        "speed_limit_kmh": 50,
        "critical_infrastructure_nearby": "Triveni Nagar Community Centre",
        "soil_runoff_coeff": 0.87,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-012",
        "name": "C-Scheme (Statue Circle to Ahinsa Circle)",
        "road_type": "secondary",
        "coordinates": [
            [26.9110, 75.8030],
            [26.9140, 75.8050],
            [26.9170, 75.8080]
        ],
        "length_m": 900,
        "elevation_m": 427.5,
        "slope_deg": 1.3,
        "distance_to_drain_m": 400,
        "drainage_status": "good",
        "drainage_capacity_m3s": 17.5,
        "basin_id": "Central Jaipur Catchment",
        "underpass": False,
        "historical_incidents_count": 3,
        "speed_limit_kmh": 40,
        "critical_infrastructure_nearby": "Birla Planetarium, Central Park",
        "soil_runoff_coeff": 0.78,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-013",
        "name": "Jhotwara Road (Lata Circle to Niwaru Crossing)",
        "road_type": "primary",
        "coordinates": [
            [26.9380, 75.7480],
            [26.9440, 75.7400],
            [26.9510, 75.7320]
        ],
        "length_m": 2300,
        "elevation_m": 389.0,
        "slope_deg": 2.0,
        "distance_to_drain_m": 150,
        "drainage_status": "partially_blocked",
        "drainage_capacity_m3s": 11.0,
        "basin_id": "Jhotwara Industrial Basin",
        "underpass": True,
        "historical_incidents_count": 12,
        "speed_limit_kmh": 50,
        "critical_infrastructure_nearby": "Jhotwara Industrial Area Gate 1",
        "soil_runoff_coeff": 0.86,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-014",
        "name": "Raja Park (Gole Market & Pranami Mandir Lane)",
        "road_type": "secondary",
        "coordinates": [
            [26.8960, 75.8280],
            [26.8920, 75.8320],
            [26.8870, 75.8360]
        ],
        "length_m": 1400,
        "elevation_m": 412.0,
        "slope_deg": 2.4,
        "distance_to_drain_m": 310,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 14.0,
        "basin_id": "East Jaipur Catchment",
        "underpass": False,
        "historical_incidents_count": 6,
        "speed_limit_kmh": 35,
        "critical_infrastructure_nearby": "Raja Park Commercial Center",
        "soil_runoff_coeff": 0.88,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-015",
        "name": "Vaishali Nagar (Amrapali Circle to Gandhi Path)",
        "road_type": "secondary",
        "coordinates": [
            [26.9050, 75.7410],
            [26.9010, 75.7440],
            [26.8960, 75.7480]
        ],
        "length_m": 1350,
        "elevation_m": 393.5,
        "slope_deg": 1.5,
        "distance_to_drain_m": 220,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 15.5,
        "basin_id": "West Jaipur Basin",
        "underpass": False,
        "historical_incidents_count": 4,
        "speed_limit_kmh": 40,
        "critical_infrastructure_nearby": "National Handloom Vaishali",
        "soil_runoff_coeff": 0.82,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-016",
        "name": "Sanganer Bridge & Airport Peripheral Road",
        "road_type": "primary",
        "coordinates": [
            [26.8280, 75.8010],
            [26.8210, 75.7950],
            [26.8120, 75.7910]
        ],
        "length_m": 2200,
        "elevation_m": 374.0,
        "slope_deg": 0.8,
        "distance_to_drain_m": 25,
        "drainage_status": "poor",
        "drainage_capacity_m3s": 9.5,
        "basin_id": "Sanganer Catchment",
        "underpass": False,
        "historical_incidents_count": 17,
        "speed_limit_kmh": 50,
        "critical_infrastructure_nearby": "Jaipur International Airport Runway South",
        "soil_runoff_coeff": 0.85,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-017",
        "name": "Sindhi Camp Bus Terminal & Station Approach Road",
        "road_type": "primary",
        "coordinates": [
            [26.9230, 75.7980],
            [26.9200, 75.7950],
            [26.9180, 75.7900]
        ],
        "length_m": 1200,
        "elevation_m": 422.0,
        "slope_deg": 2.1,
        "distance_to_drain_m": 380,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 16.0,
        "basin_id": "Railway Catchment",
        "underpass": True,
        "historical_incidents_count": 8,
        "speed_limit_kmh": 40,
        "critical_infrastructure_nearby": "Central Bus Station, Metro Interchange",
        "soil_runoff_coeff": 0.90,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-018",
        "name": "Delhi Bypass & Transport Nagar Tunnel Exit",
        "road_type": "primary",
        "coordinates": [
            [26.9080, 75.8580],
            [26.9140, 75.8650],
            [26.9200, 75.8720]
        ],
        "length_m": 2100,
        "elevation_m": 425.0,
        "slope_deg": 3.6,
        "distance_to_drain_m": 210,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 18.0,
        "basin_id": "East Valley Catchment",
        "underpass": True,
        "historical_incidents_count": 5,
        "speed_limit_kmh": 65,
        "critical_infrastructure_nearby": "Ghat Ki Guni Tunnel Approach",
        "soil_runoff_coeff": 0.81,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-019",
        "name": "Vidhyadhar Nagar Sector 5 (Low-lying Spine Road)",
        "road_type": "secondary",
        "coordinates": [
            [26.9650, 75.7820],
            [26.9710, 75.7850],
            [26.9780, 75.7890]
        ],
        "length_m": 1600,
        "elevation_m": 396.0,
        "slope_deg": 1.2,
        "distance_to_drain_m": 140,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 14.5,
        "basin_id": "North Valley Catchment",
        "underpass": False,
        "historical_incidents_count": 6,
        "speed_limit_kmh": 45,
        "critical_infrastructure_nearby": "Sector 5 Stadium",
        "soil_runoff_coeff": 0.83,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-020",
        "name": "Sahakar Marg (Jyoti Nagar to 22 Godam Circle)",
        "road_type": "secondary",
        "coordinates": [
            [26.9030, 75.7950],
            [26.8990, 75.7980],
            [26.8940, 75.8020]
        ],
        "length_m": 1300,
        "elevation_m": 414.0,
        "slope_deg": 1.7,
        "distance_to_drain_m": 310,
        "drainage_status": "good",
        "drainage_capacity_m3s": 19.0,
        "basin_id": "Central Jaipur Catchment",
        "underpass": False,
        "historical_incidents_count": 3,
        "speed_limit_kmh": 40,
        "critical_infrastructure_nearby": "Rajasthan Legislative Assembly",
        "soil_runoff_coeff": 0.77,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-021",
        "name": "Malviya Nagar Calgiri Marg (Hospital Basin)",
        "road_type": "secondary",
        "coordinates": [
            [26.8620, 75.8150],
            [26.8570, 75.8200],
            [26.8510, 75.8240]
        ],
        "length_m": 1500,
        "elevation_m": 398.0,
        "slope_deg": 1.9,
        "distance_to_drain_m": 190,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 15.0,
        "basin_id": "Malviya Catchment",
        "underpass": False,
        "historical_incidents_count": 5,
        "speed_limit_kmh": 40,
        "critical_infrastructure_nearby": "Apex Hospital Malviya Nagar",
        "soil_runoff_coeff": 0.84,
        "is_culvert_present": False
    },
    {
        "segment_id": "JPR-RD-022",
        "name": "Khatipura Road (Jhulelal Mandir to Railway Overbridge)",
        "road_type": "secondary",
        "coordinates": [
            [26.9180, 75.7550],
            [26.9230, 75.7500],
            [26.9290, 75.7460]
        ],
        "length_m": 1550,
        "elevation_m": 394.0,
        "slope_deg": 1.8,
        "distance_to_drain_m": 240,
        "drainage_status": "adequate",
        "drainage_capacity_m3s": 13.5,
        "basin_id": "West Jaipur Basin",
        "underpass": True,
        "historical_incidents_count": 8,
        "speed_limit_kmh": 45,
        "critical_infrastructure_nearby": "Khatipura Satellite Station",
        "soil_runoff_coeff": 0.85,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-023",
        "name": "Ajmer Road 200 Feet Bypass Interchange",
        "road_type": "primary",
        "coordinates": [
            [26.8790, 75.7310],
            [26.8850, 75.7380],
            [26.8920, 75.7480]
        ],
        "length_m": 2200,
        "elevation_m": 387.0,
        "slope_deg": 1.5,
        "distance_to_drain_m": 110,
        "drainage_status": "partially_blocked",
        "drainage_capacity_m3s": 12.0,
        "basin_id": "West Bypass Basin",
        "underpass": True,
        "historical_incidents_count": 10,
        "speed_limit_kmh": 65,
        "critical_infrastructure_nearby": "Heerapura Power Grid",
        "soil_runoff_coeff": 0.81,
        "is_culvert_present": True
    },
    {
        "segment_id": "JPR-RD-024",
        "name": "Nahargarh Fort Hill Descent Road",
        "road_type": "tertiary",
        "coordinates": [
            [26.9380, 75.8200],
            [26.9440, 75.8230],
            [26.9500, 75.8270]
        ],
        "length_m": 1800,
        "elevation_m": 530.0,
        "slope_deg": 11.5,
        "distance_to_drain_m": 450,
        "drainage_status": "good",
        "drainage_capacity_m3s": 25.0,
        "basin_id": "Nahargarh Ridge",
        "underpass": False,
        "historical_incidents_count": 1,
        "speed_limit_kmh": 30,
        "critical_infrastructure_nearby": "Nahargarh Wildlife Sanctuary Gate",
        "soil_runoff_coeff": 0.65,
        "is_culvert_present": True
    }
]

# Critical Jaipur Municipal Drainage Infrastructure
JAIPUR_DRAINAGE_FEATURES = [
    {
        "drain_id": "DRN-JPR-001",
        "name": "Dravyavati River Main Channel (Amanishah Nallah)",
        "type": "river_rejuvenation_channel",
        "length_km": 47.5,
        "condition": "monitored",
        "flow_capacity_m3s": 120.0,
        "coordinates": [
            [26.9600, 75.7700],
            [26.9000, 75.7750],
            [26.8500, 75.7900],
            [26.8000, 75.8100]
        ]
    },
    {
        "drain_id": "DRN-JPR-002",
        "name": "Gopalpura Bypass Arterial Storm Drain",
        "type": "covered_concrete_canal",
        "length_km": 6.8,
        "condition": "partially_silted",
        "flow_capacity_m3s": 18.5,
        "coordinates": [
            [26.8610, 75.7700],
            [26.8630, 75.7850],
            [26.8645, 75.7980]
        ]
    },
    {
        "drain_id": "DRN-JPR-003",
        "name": "Jal Mahal Catchment Outlet & Weir",
        "type": "lake_overflow_weir",
        "length_km": 3.2,
        "condition": "adequate",
        "flow_capacity_m3s": 35.0,
        "coordinates": [
            [26.9550, 75.8380],
            [26.9650, 75.8450]
        ]
    },
    {
        "drain_id": "DRN-JPR-004",
        "name": "Sikar Road Storm Nallah",
        "type": "open_masonry_drain",
        "length_km": 5.4,
        "condition": "partially_silted",
        "flow_capacity_m3s": 12.0,
        "coordinates": [
            [26.9450, 75.7650],
            [26.9600, 75.7610],
            [26.9750, 75.7560]
        ]
    }
]

# Emergency Response Infrastructure in Jaipur
JAIPUR_EMERGENCY_SERVICES = [
    {
        "id": "EMG-JPR-001",
        "name": "State Disaster Response Force (SDRF) HQ Jaipur",
        "service_type": "disaster_response",
        "phone": "+91-141-2751500",
        "coordinates": [26.8510, 75.8110],
        "address": "Malviya Nagar Industrial Area, Jaipur"
    },
    {
        "id": "EMG-JPR-002",
        "name": "Jaipur Municipal Corporation (JMC) Flood Control Room",
        "service_type": "municipal_control",
        "phone": "0141-2742900",
        "coordinates": [26.9180, 75.8180],
        "address": "Pandit Deendayal Upadhyay Bhawan, Lal Kothi, Jaipur"
    },
    {
        "id": "EMG-JPR-003",
        "name": "SMS Medical College & Hospital Emergency Trauma Centre",
        "service_type": "medical_trauma",
        "phone": "108 / 0141-2560291",
        "coordinates": [26.9150, 75.8180],
        "address": "JLN Marg, Jaipur"
    },
    {
        "id": "EMG-JPR-004",
        "name": "Fire Brigade Headquarters Jaipur (Ghat Gate)",
        "service_type": "fire_rescue",
        "phone": "101 / 0141-2601100",
        "coordinates": [26.9110, 75.8300],
        "address": "Ghat Gate, Walled City, Jaipur"
    }
]
