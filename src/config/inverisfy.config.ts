import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import "reflect-metadata";

export const container = new Container({
  defaultScope: "Singleton",
  autoBindInjectable: true,
});

export const { lazyInject } = getDecorators(container);