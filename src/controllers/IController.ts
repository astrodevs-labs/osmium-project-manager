export interface IController {
  run(context: any, command: any): Promise<void>;
}