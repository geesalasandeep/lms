import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CourseService } from '../../services/course.service';

export interface Example {
    input: string;
    output: string;
    explanation?: string;
}

export interface Problem {
    id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    examples: Example[];
}

@Component({
    selector: 'app-playground',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './playground.component.html',
    styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {
    route = inject(ActivatedRoute);
    router = inject(Router);
    http = inject(HttpClient);
    courseService = inject(CourseService);

    @ViewChild('editor') editor!: ElementRef<HTMLTextAreaElement>;

    courseId: string | null = null;
    loading = true;
    executing = false;
    output = '';
    isError = false;

    selectedLanguage = 'javascript';
    userCode = '';
    lineNumbers: number[] = [1];

    problems: Problem[] = [
        {
            id: 1,
            title: 'Two Sum',
            difficulty: 'Easy',
            description: 'Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.',
            examples: [
                { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
            ]
        },
        {
            id: 2,
            title: 'Valid Palindrome',
            difficulty: 'Easy',
            description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
            examples: [
                { input: 's = "A man, a plan, a canal: Panama"', output: 'true' }
            ]
        },
        {
            id: 3,
            title: 'Reverse Linked List',
            difficulty: 'Medium',
            description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
            examples: [
                { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }
            ]
        }
    ];

    selectedProblem: Problem = this.problems[0];

    languages = [
        { id: 'javascript', name: 'JavaScript', default: 'function solve(input) {\n    // Write your code here\n    console.log("Hello JS");\n}' },
        { id: 'python', name: 'Python', default: 'def solve():\n    # Write your code here\n    print("Hello Python")\n\nsolve()' },
        { id: 'java', name: 'Java', default: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello Java");\n    }\n}' },
        { id: 'cpp', name: 'C++', default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello C++" << endl;\n    return 0;\n}' },
        { id: 'c', name: 'C', default: '#include <stdio.h>\n\nint main() {\n    printf("Hello C\\n");\n    return 0;\n}' }
    ];

    ngOnInit() {
        this.courseId = this.route.snapshot.paramMap.get('courseId');
        this.resetCode();
        setTimeout(() => {
            this.loading = false;
            this.updateLineNumbers();
        }, 1000);
    }

    selectProblem(problem: Problem) {
        this.selectedProblem = problem;
    }

    onLanguageChange() {
        this.resetCode();
    }

    resetCode() {
        const lang = this.languages.find(l => l.id === this.selectedLanguage);
        this.userCode = lang ? lang.default : '';
        this.updateLineNumbers();
    }

    updateLineNumbers() {
        const lines = this.userCode.split('\n').length;
        this.lineNumbers = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1);
    }

    handleTab(event: KeyboardEvent) {
        if (event.key === 'Tab') {
            event.preventDefault();
            const start = this.editor.nativeElement.selectionStart;
            const end = this.editor.nativeElement.selectionStart;

            this.userCode = this.userCode.substring(0, start) + '    ' + this.userCode.substring(end);

            setTimeout(() => {
                this.editor.nativeElement.selectionStart = this.editor.nativeElement.selectionEnd = start + 4;
            });
        }
    }

    runCode() {
        this.executing = true;
        this.output = '';
        this.isError = false;
        const timestamp = new Date().toLocaleTimeString();

        if (this.selectedLanguage === 'javascript') {
            const logs: string[] = [];
            const customConsole = {
                log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
                error: (...args: any[]) => {
                    this.isError = true;
                    logs.push('ERROR: ' + args.join(' '));
                }
            };

            try {
                const runFunc = new Function('console', this.userCode + `
                    if(typeof solve === "function") {
                        try {
                            const mockInput = [2, 7, 11, 15];
                            const mockTarget = 9;
                            solve(mockInput, mockTarget);
                        } catch(e) {
                            console.error("Function Execution Error: " + e.message);
                        }
                    }
                `);
                runFunc(customConsole);
                this.output = logs.join('\n');
                if (!this.output) this.output = `[${timestamp}] Code executed successfully (no output).`;
                this.executing = false;
            } catch (err: any) {
                this.output = `COMPILE ERROR: ${err.message}`;
                this.isError = true;
                this.executing = false;
            }
            return;
        }

        this.courseService.runPlaygroundCode({
            language: this.selectedLanguage,
            code: this.userCode,
            problemId: this.selectedProblem.id
        }).subscribe({
            next: (res: any) => {
                this.output = res.output || 'Execution complete with no output.';
                this.isError = res.error;
                this.executing = false;
            },
            error: (err) => {
                this.output = 'System Error: Unable to perform remote code execution. Please check your internet connection.';
                this.isError = true;
                this.executing = false;
            }
        });
    }
}
