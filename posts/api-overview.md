---
title: 'Application Programming Interfaces'
date: '2022-06-06'
image: api-main.png
excerpt: API stands for application programming interface, a concept that applies everywhere from command-line tools to enterprise Java code to Ruby on Rails web apps. An API is a way to programmatically interact with a separate software component or resource.
isFeatured: true
---

## What is an API? 

API stands for application programming interface, a concept that applies everywhere from command-line tools to enterprise Java code to Ruby on Rails web apps. An API is a way to programmatically interact with a separate software component or resource.

Unless you write every single line of code from scratch, you’re going to be interacting with external software components, each with its own API. Even if you do write something entirely from scratch, a well-designed software application will have internal APIs to help organize code and make components more reusable. And there are numerous public APIs that allow you to tap into functionality developed elsewhere over the web.


### Types of APIs

### What is an API?
API stands for Application Programming Interface, which is a mechanism that allows the interaction between two applications using a set of rules.

APIs are beneficial because they allow developers to add specific functionality to an application, without having to write all of the code themselves. APIs also allow developers to access data from other applications. For example, when bloggers put their Twitter handle on their blog’s sidebar, WordPress enables this by using Twitter’s API.

### Main types of Web APIs
There are four main types of APIs:

- Open APIs: Also known as Public API, there are no restrictions to access these types of APIs because they are publicly available.
- Partner APIs: A developer needs specific rights or licenses in order to access this type of API because they are not available to the public.
- Internal APIs: Also known as Private APIs, only internal systems expose this type of API. These are usually designed for internal use within a company. The company uses this type of API among the different internal teams to be able to improve its products and services.
- Composite APIs: This type of API combines different data and service APIs. It is a sequence of tasks that run synchronously as a result of the execution, and not at the request of a task. Its main uses are to speed up the process of execution and improve the performance of the listeners in the web interfaces.

## Web service APIs

- SOAP
  - SOAP (Simple Object Access Protocol): This is a protocol that uses XML as a format to transfer data. Its main function is to define the structure of the messages and methods of communication. It also uses WSDL, or Web Services Definition Language, in a machine-readable document to publish a definition of its interface.
  - Added data types
  - Envelope wraps header and body
- XML-RPC
  - XML-RPC: This is a protocol that uses a specific XML format to transfer data compared to SOAP that uses a proprietary XML format. It is also older than SOAP. XML-RPC uses minimum bandwidth and is much simpler than SOAP. 
- JSON-RPC
  - JSON-RPC: This protocol is similar to XML-RPC but instead of using XML format to transfer data it uses JSON
- REST
  - REST (Representational State Transfer): REST is not a protocol like the other web services, instead, it is a set of architectural principles. The REST service needs to have certain characteristics, including simple interfaces, which are resources identified easily within the request and manipulation of resources using the interface.
  - Added GET,POST,PUT,DELETE http methods and caching
  - Allows Middleware
  - Uniform interface
  - Sets constraints
  - replaced SOAP
- GraphQL
  - GraphQL Rest APIs were too chatty and downloads to much data
  - GraphQL makes a Single Precise Request and returns an all inclusive reply. No need to mix and match endpoints
  - Uses a Schema to facilitate
  - Quickly becoming the default but harder to learn.






Information Sourced from: [Rapid API](https://rapidapi.com/blog/types-of-apis/)