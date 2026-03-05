import { useLocation } from "react-router";

export default function useURL() {
    return new URLSearchParams(useLocation().search);
}
