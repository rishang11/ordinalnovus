import React, { useCallback } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Image from "next/image";

interface CustomTabProps {
  tabsData: Array<{
    label: string;
    value: any;
    disabled?: boolean;
    withIcon?: boolean;
    activeIcon?: any;
    disabedIcon?: any;
  }>;
  currentTab: any;
  onTabChange: (event: React.ChangeEvent<{}>, newValue: any) => void;
  separator?: boolean;
}

const CustomTab = ({
  tabsData,
  currentTab,
  onTabChange,
  separator = false,
}: CustomTabProps) => {
  const WrapperTab = useCallback(
    (props: any) => {
      const { tab, index, tabIcon, isActive } = props;
      return (
        <React.Fragment key={`key-${index}`}>
          <Tab
            icon={
              tab.withIcon && tab.activeIcon && tab.disabedIcon ? (
                <Image src={tabIcon} alt="tab icon" />
              ) : undefined
            }
            iconPosition="start"
            label={tab.label}
            value={tab.value}
            disabled={tab.disabled || isActive}
            sx={{
              fontSize: "14px",
              fontWeight: "700",
              "&.Mui-selected": {
                color: "#fff",
              },
              padding: "22px",
              margin: "0 4px",
              borderRadius: "4px",
              backgroundColor: isActive ? "#9102F0" : "#4d4d4d",
              color: isActive ? "#fff" : "#fff", // White text for active and inactive tabs
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              textTransform: "uppercase",
              // fontWeight: "bold",
              opacity: tab.disabled ? 0.5 : 1,
              cursor: tab.disabled ? "not-allowed !important" : "pointer",
              "&:hover": {
                backgroundColor: isActive || tab.disabled ? "" : "#8e8e8e",
              },
              "&.MuiButtonBase-root": {
                height: "40px",
                minHeight: "40px",
                color: "white",
              },
              "&.Mui-disabled": {
                pointerEvents: "auto",
              },
            }}
            {...props}
          />
          {separator && index !== tabsData.length - 1 && (
            <div className="h-[21px] border-[1.5px] border-dark_gray my-auto mx-2" />
          )}
        </React.Fragment>
      );
    },
    [tabsData, currentTab]
  );

  return (
    <Tabs
      value={currentTab}
      onChange={(e, indx) => onTabChange(e, tabsData[indx].value)}
      sx={{
        backgroundColor: "transparent",
        borderBottom: 0,
        ".MuiTabs-indicator": {
          // Hide the underline indicator
          display: "none",
        },
        margin: "10px 0",
      }}
    >
      {tabsData.map((tab, index) => {
        const isActive = currentTab === tab.value;
        const icon = isActive ? tab.activeIcon : tab.disabedIcon;
        return (
          <WrapperTab
            key={index}
            tab={tab}
            index={index}
            tabIcon={icon}
            isActive={isActive}
          />
        );
      })}
    </Tabs>
  );
};

export default CustomTab;
