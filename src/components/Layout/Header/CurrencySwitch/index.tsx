import { RootState } from "@/stores";
import { setCurrency } from "@/stores/reducers/generalReducer";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React, { useEffect } from "react";
import { FaBtc } from "react-icons/fa";
import { IoLogoUsd } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";

function CurrencySwitch() {
  const dispatch = useDispatch();

  const currency = useSelector((state: RootState) => state.general.currency);

  const handleCurrency = (
    _event: React.MouseEvent<HTMLElement>,
    newCurrency: string | null
  ) => {
    if (newCurrency) {
      localStorage.setItem("currency", newCurrency); // Store the choice in localStorage
      dispatch(setCurrency(newCurrency));
    }
  };

  useEffect(() => {
    const storedCurrency = localStorage.getItem("currency");
    if (storedCurrency) {
      dispatch(setCurrency(storedCurrency));
    } else {
      localStorage.setItem("currency", currency.toString());
    }
  }, [currency]);

  return (
    <div className="mx-3">
      <ToggleButtonGroup
        value={currency}
        exclusive
        onChange={handleCurrency}
        aria-label="set currency"
        color="secondary" // This sets the secondary color to the selected button
      >
        <ToggleButton
          value="USD"
          aria-label="USD"
          sx={{
            backgroundColor: "#0c082a",
            color: currency === "USD" ? "secondary.main" : "white",
            "& .MuiSvgIcon-root": { fontSize: 28 }, // Adjust icon size as needed
          }}
        >
          <IoLogoUsd />
        </ToggleButton>
        <ToggleButton
          value="BTC"
          aria-label="BTC"
          sx={{
            backgroundColor: "#0c082a",
            color: currency === "BTC" ? "secondary.main" : "white",
            "& .MuiSvgIcon-root": { fontSize: 28 }, // Adjust icon size as needed
          }}
        >
          <FaBtc />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}

export default CurrencySwitch;
