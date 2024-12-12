import { Accordion, HStack, AccordionButton, AccordionPanel, AccordionItem as ChakraAccordionItem } from "@chakra-ui/react";
import * as React from "react";
import { LuChevronDown } from "react-icons/lu";

interface AccordionItemTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  indicatorPlacement?: "start" | "end";
}

// Trigger Component
export const AccordionItemTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionItemTriggerProps
>(function AccordionItemTrigger(props, ref) {
  const { children, indicatorPlacement = "end", ...rest } = props;
  return (
    <AccordionButton ref={ref} {...rest}>
      {indicatorPlacement === "start" && (
        <HStack as="span" alignItems="center" marginRight="2">
          <LuChevronDown />
        </HStack>
      )}
      <HStack flex="1" textAlign="start" width="full">
        {children}
      </HStack>
      {indicatorPlacement === "end" && (
        <HStack as="span" alignItems="center" marginLeft="2">
          <LuChevronDown />
        </HStack>
      )}
    </AccordionButton>
  );
});

interface AccordionItemContentProps extends React.ComponentPropsWithoutRef<"div"> {}

// Content Component
export const AccordionItemContent = React.forwardRef<
  HTMLDivElement,
  AccordionItemContentProps
>(function AccordionItemContent(props, ref) {
  const { children, ...rest } = props;
  return (
    <AccordionPanel ref={ref} {...rest}>
      {children}
    </AccordionPanel>
  );
});

// Wrapper Components
export const AccordionRoot = Accordion;
export const AccordionItem = ChakraAccordionItem;
