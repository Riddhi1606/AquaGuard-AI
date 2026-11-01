"""
AquaGuard AI — Safe Route Recommendation Engine
Uses NetworkX to build a topological road graph for Jaipur.
Computes:
1. Standard Shortest Route (Pure geographical distance)
2. Risk-Aware Safe Alternative (Penalizes flooded/waterlogged road segments)
Highlights avoided high-risk bottlenecks and explains routing trade-offs.
"""

import math
from typing import Dict, Any, List, Tuple, Optional
import networkx as nx

def _haversine_distance(coord1: List[float], coord2: List[float]) -> float:
    """Calculates distance between two lat/lon coordinates in meters."""
    R = 6371000  # meters
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class SafeRoutingEngine:
    def __init__(self, segments: List[Dict[str, Any]]):
        self.segments = segments
        self.graph = nx.Graph()
        self._build_graph()

    def _build_graph(self):
        """Constructs an interconnected road network graph from road segments."""
        for seg in self.segments:
            coords = seg.get("coordinates", [])
            if len(coords) < 2:
                continue

            length = float(seg.get("length_m", 1000.0))
            risk = float(seg.get("risk_score", 15.0))
            seg_id = seg.get("segment_id", "")
            name = seg.get("name", "")

            step_len = length / max(1, len(coords) - 1)
            penalty_factor = 1.0 + (risk / 22.0) ** 2.4
            if risk >= 80.0:
                penalty_factor *= 5.0
            step_safe_weight = step_len * penalty_factor

            for k in range(len(coords) - 1):
                u = tuple(coords[k])
                v = tuple(coords[k + 1])
                self.graph.add_edge(
                    u, v,
                    segment_id=seg_id,
                    name=name,
                    distance=step_len,
                    safe_weight=step_safe_weight,
                    risk=risk,
                    coords=[list(u), list(v)]
                )

        # Do not connect disconnected components with straight-line edges.
        # Such synthetic links can route users through buildings or off-road.
        # A disconnected graph correctly returns NO_ROUTE_FOUND below.


    def _find_nearest_node(self, target_coord: List[float]) -> Tuple[float, float]:
        """Finds closest node in the road graph to the requested GPS point."""
        nodes = list(self.graph.nodes)
        if not nodes:
            return tuple(target_coord)
        best_node = nodes[0]
        min_dist = float("inf")
        for node in nodes:
            dist = _haversine_distance(target_coord, list(node))
            if dist < min_dist:
                min_dist = dist
                best_node = node
        return best_node

    def calculate_routes(
        self,
        start_coord: List[float],
        end_coord: List[float]
    ) -> Dict[str, Any]:
        """
        Computes shortest and lower-relative-score paths on the bundled illustrative road graph.
        Returns detailed comparison and list of avoided high-risk segments.
        """
        start_node = self._find_nearest_node(start_coord)
        end_node = self._find_nearest_node(end_coord)
        start_snap_distance = _haversine_distance(start_coord, list(start_node))
        end_snap_distance = _haversine_distance(end_coord, list(end_node))
        max_snap_distance_m = 1500.0
        if max(start_snap_distance, end_snap_distance) > max_snap_distance_m:
            return {
                "route_status": "POINT_OUTSIDE_DEMO_NETWORK",
                "standard_route": {"coordinates": [], "distance_m": 0, "avg_risk": 0},
                "safe_route": {"coordinates": [], "distance_m": 0, "avg_risk": 0},
                "segments_avoided": [],
                "risk_reduction_pct": 0.0,
                "distance_delta_meters": 0.0,
                "travel_advisory": (
                    "Origin or destination is more than 1.5 km from the bundled demo road graph. "
                    "No route was generated; this prototype does not snap distant points to an assumed road."
                )
            }

        if start_node == end_node:
            return {
                "route_status": "START_AND_END_IDENTICAL",
                "standard_route": {"coordinates": [], "distance_m": 0, "avg_risk": 0},
                "safe_route": {"coordinates": [], "distance_m": 0, "avg_risk": 0},
                "segments_avoided": [],
                "risk_reduction_pct": 0.0,
                "distance_delta_meters": 0.0,
                "travel_advisory": "Start and destination points are at the same location."
            }

        try:
            # 1. Standard shortest path (by distance)
            std_path = nx.shortest_path(self.graph, source=start_node, target=end_node, weight="distance")
            
            # 2. Flood-safe path (by safe_weight)
            safe_path = nx.shortest_path(self.graph, source=start_node, target=end_node, weight="safe_weight")

            std_metrics = self._extract_path_details(std_path)
            safe_metrics = self._extract_path_details(safe_path)

            # Determine avoided segments
            std_seg_ids = set(s["segment_id"] for s in std_metrics["segments"])
            safe_seg_ids = set(s["segment_id"] for s in safe_metrics["segments"])
            avoided_ids = std_seg_ids - safe_seg_ids

            avoided_details = []
            for seg in std_metrics["segments"]:
                if seg["segment_id"] in avoided_ids and seg["risk"] >= 45.0:
                    avoided_details.append({
                        "segment_id": seg["segment_id"],
                        "name": seg["name"],
                        "risk_score": seg["risk"],
                        "risk_category": "CRITICAL" if seg["risk"] >= 80 else ("HIGH" if seg["risk"] >= 60 else "MODERATE")
                    })

            risk_reduction = max(0.0, std_metrics["avg_risk"] - safe_metrics["avg_risk"])
            dist_delta = safe_metrics["distance_m"] - std_metrics["distance_m"]

            advisory = "A lower relative-risk route was computed on the bundled illustrative road graph. It is not a verified safe route or live road-condition service."
            if avoided_details:
                advisory = f"The prototype route differs from the shortest path and avoids {len(avoided_details)} higher-scored demo segment(s), including {avoided_details[0]['name']}. Scores use illustrative inputs; verify current conditions independently."
            elif std_metrics["avg_risk"] < 30.0:
                advisory = "The shortest path has a low prototype score under configured assumptions. This does not establish that the road is safe; verify current conditions."

            return {
                "route_status": "SUCCESS",
                "standard_route": std_metrics,
                "safe_route": safe_metrics,
                "segments_avoided": avoided_details,
                "risk_reduction_pct": round(risk_reduction, 1),
                "distance_delta_meters": round(dist_delta, 1),
                "travel_advisory": advisory
            }

        except nx.NetworkXNoPath:
            return {
                "route_status": "NO_ROUTE_FOUND",
                "standard_route": {"coordinates": [], "distance_m": 0, "avg_risk": 0},
                "safe_route": {"coordinates": [], "distance_m": 0, "avg_risk": 0},
                "segments_avoided": [],
                "risk_reduction_pct": 0.0,
                "distance_delta_meters": 0.0,
                "travel_advisory": "No continuous road path could be found between specified coordinates."
            }

    def _extract_path_details(self, path: List[Tuple[float, float]]) -> Dict[str, Any]:
        """Extracts full polyline coordinates, cumulative distance, and average risk along path."""
        coords = []
        total_dist = 0.0
        risk_accum = 0.0
        segments = []

        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            edge_data = self.graph.get_edge_data(u, v)
            if edge_data:
                edge_coords = edge_data.get("coords", [list(u), list(v)])
                if coords and coords[-1] == edge_coords[0]:
                    coords.extend(edge_coords[1:])
                else:
                    coords.extend(edge_coords)
                d = edge_data.get("distance", 500.0)
                r = edge_data.get("risk", 20.0)
                total_dist += d
                risk_accum += r * d
                segments.append({
                    "segment_id": edge_data.get("segment_id"),
                    "name": edge_data.get("name"),
                    "risk": r,
                    "distance": d
                })
            else:
                coords.append(list(u))

        avg_risk = (risk_accum / total_dist) if total_dist > 0 else 15.0

        return {
            "coordinates": coords if coords else [list(p) for p in path],
            "distance_m": round(total_dist, 1),
            "distance_km": round(total_dist / 1000.0, 2),
            "avg_risk": round(avg_risk, 1),
            "segments": segments
        }
