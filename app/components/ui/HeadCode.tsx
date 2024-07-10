import React from "react";
import Code from "./Code";
import { Collapse } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

const HeadCode = ({ code, language }: { code: string[]; language: string }) => {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <>
      <button onClick={toggle} type="button">
        open
      </button>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <h2>hello</h2>
      <Collapse in={opened} transitionDuration={0}>
        <Code language={language} code={code} />
      </Collapse>
    </>
  );
};

export default HeadCode;
