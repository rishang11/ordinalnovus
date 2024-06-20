// CustomPagination.tsx
import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import { styled } from "@mui/system";
import { TextField } from "@mui/material";

const CustomPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-root": {
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    backgroundColor: "#04020E",
    border: "1px solid #9102F080",
  },
  "& .MuiPaginationItem-page.Mui-selected": {
    backgroundColor: "#9102F01A",
    border: "1px solid #9102F0",
  },
  "& .MuiPaginationItem-page.Mui-selected:hover": {
    backgroundColor: "#9102F01A",
  },
  "& .MuiPaginationItem-ellipsis": {
    borderColor: "transparent",
  },
  "& .MuiPaginationItem-previousNext": {
    color: "#A6A6A6",
  },
}));

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    height: 30,
    width: 70,
    marginRight: 8,
    color: "white",
    backgroundColor: "#04020E !important",
    borderRadius: 4,
  },
  "& .MuiOutlinedInput-input": {
    textAlign: "center",
    padding: "5px 6px",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "1px solid #9102F080 !important",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    border: "1px solid #9102F080 !important",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "none",
  },
});
interface CustomPaginationComponentProps {
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

const CustomPaginationComponent: React.FC<CustomPaginationComponentProps> = ({
  count,
  page,
  onChange,
}) => {
  const [inputPage, setInputPage] = useState(page);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(parseInt(event.target.value) || 1);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange(event, inputPage > count ? count : inputPage);
  };

  return (
    <>
      {count > 100 ? (
        <form onSubmit={handleSubmit}>
          <StyledTextField
            size="small"
            variant="outlined"
            type="number"
            value={inputPage}
            onChange={handleInputChange}
            inputProps={{ min: 1, max: count }}
          />
        </form>
      ) : (
        <></>
      )}
      <CustomPagination
        siblingCount={0}
        boundaryCount={2}
        count={count}
        page={page}
        variant="outlined"
        shape="rounded"
        onChange={onChange}
      />
    </>
  );
};

export default CustomPaginationComponent;
