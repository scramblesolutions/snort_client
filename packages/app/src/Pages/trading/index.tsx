import { RouteObject } from "react-router-dom";
import { OfferList } from "./offers";

export const TradingRoutes = [
    {
        path: "/trading",
        element: <OfferList />
    }
] as Array<RouteObject>