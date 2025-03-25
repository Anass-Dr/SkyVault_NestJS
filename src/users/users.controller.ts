import { Body, Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    async findAll(@Query('userId') userId: string) {
        return this.usersService.findAll(userId);
    }
}
